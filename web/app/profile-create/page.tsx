"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useSupabaseClient, useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { TextInputField } from "@/components/ui/TextInputField";
import { TextareaField } from "@/components/ui/TextareaField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import ProfileInsightReport from "@/components/ProfileInsightReport";
// Base URL for backend API (set via NEXT_PUBLIC_API_BASE_URL in .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Type for insight report data
interface InsightReport {
  summary_markdown: string;
  strengths: string[];
  blindspots: string[];
  next_steps: string[];
}
// Map of SNS base URLs for prefixing handle input
const snsBaseUrlMap: Record<string, string> = {
  Instagram: "https://instagram.com/",
  TikTok: "https://tiktok.com/@",
  YouTube: "https://youtube.com/",
};

interface ProfileFormValues {
  profile_type: string;
  primary_sns_channel: string;
  sns_handle: string;
  primary_objective: string;
  email: string;
  follower_count: string;
  locale: string;
  comments: string;
}

export default function ProfileCreatePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { session, isLoading } = useSessionContext();

  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<{ sender: 'user' | 'agent'; content: string }[]>([]);
  // Step 3: collected profile fields for review/edit
  const [collectedFields, setCollectedFields] = useState<Record<string, string>>({});
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // Step 4: insight report data and loading state
  const [reportData, setReportData] = useState<InsightReport | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      localStorage.setItem("postLoginRedirect", window.location.pathname);
      router.replace("/login");
    }
  }, [session, isLoading, router]);

  // Form setup (step 1)
  const { control, handleSubmit, watch } = useForm<ProfileFormValues>({
    defaultValues: {
      profile_type: '',
      primary_sns_channel: '',
      sns_handle: '',
      primary_objective: '',
      email: '',
      follower_count: '',
      locale: '',
      comments: '',
    },
  });
  // Local state for full SNS URL
  const [snsUrl, setSnsUrl] = useState<string>("");
  // Watch selected channel and handle for dynamic URL
  const watchChannel = watch("primary_sns_channel");
  const watchHandle = watch("sns_handle");
  useEffect(() => {
    const base = snsBaseUrlMap[watchChannel] || "";
    setSnsUrl(base + (watchHandle || ""));
  }, [watchChannel, watchHandle]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    // Basic validation
    if (!data.profile_type || !data.primary_sns_channel || !data.sns_handle || !data.primary_objective) {
      alert('Please fill in all required fields.');
      return;
    }
    if (!session) return;
    const followerCountNum = data.follower_count ? parseInt(data.follower_count, 10) : null;
    const insertData: any = {
      profile_type: data.profile_type,
      primary_sns_channel: data.primary_sns_channel,
      sns_handle: data.sns_handle,
      sns_url: snsUrl,
      primary_objective: data.primary_objective,
      email: data.email || null,
      follower_count: followerCountNum,
      locale: data.locale || null,
      comments: data.comments || null,
      user_id: session.user.id,
    };
    const { data: createdProfile, error } = await supabase
      .from('profiles')
      .upsert(insertData)
      .select()
      .single();
    if (error) {
      console.error('Error creating profile:', error);
      return;
    }
    setProfile(createdProfile);
    setStep(2);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  // Fetch collected fields for Step 3 review when transitioning
  useEffect(() => {
    if (step === 3 && profile) {
      const fetchCollected = async () => {
        const { data: rows, error } = await supabase
          .from('agent_messages')
          .select('message_content')
          .eq('task_id', profile.id)
          .eq('message_type', 'profile_partial');
        if (error) {
          console.error('Error fetching collected fields:', error);
          return;
        }
        const merged: Record<string, string> = {};
        (rows || []).forEach((r: any) => {
          const content = r.message_content;
          if (content && typeof content === 'object') {
            Object.assign(merged, content);
          }
        });
        setCollectedFields(merged);
      };
      fetchCollected();
    }
  }, [step, profile, supabase]);

  // Handle sending messages (step 2)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session || !profile) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      // Send chat message to profilebuilder endpoint using dynamic base URL
      const res = await fetch(`${API_BASE_URL}/profilebuilder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: profile.id, user_id: session.user.id, prompt: userMessage }),
      });
      if (!res.ok) {
        console.error('Agent error:', await res.text());
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Insert structured sections into DB
      if (data.type === 'structured' && data.sections) {
        const sectionsToInsert = data.sections.map((sec: any) => ({
          profile_id: profile.id,
          ...sec,
        }));
        const { error: insertError } = await supabase.from('profile_report_sections').insert(sectionsToInsert);
        if (insertError) console.error('Error inserting sections:', insertError);
      }
      // Display agent response: prefer message_content, then message, else fallback to raw data
      const agentContent = data.message_content ?? data.message ??
        (typeof data === 'string' ? data : JSON.stringify(data));
      setMessages((prev) => [...prev, { sender: 'agent', content: agentContent }]);
      // Auto-transition to Step 3 when step_complete received
      if (data.type === 'step_complete') {
        // delay slightly to show final message
        setTimeout(() => setStep(3), 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };
  // Handle generating insight report (Step 3)
  const handleGenerate = async () => {
    if (!session || !profile) return;
    setReportLoading(true);
    try {
      // Request insight report from profile_analyzer endpoint using dynamic base URL
      const res = await fetch(`${API_BASE_URL}/profile_analyzer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: profile.id,
          user_id: session.user.id,
          profile: collectedFields,
        }),
      });
      if (!res.ok) {
        console.error('Error generating insight report:', await res.text());
        return;
      }
      const data: InsightReport = await res.json();
      console.log('Insight report response:', data);
      setReportData(data);
      setStep(4);
    } catch (error) {
      console.error('Error generating insight report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  // Option placeholders
  const profileTypeOptions = [
    { value: '', label: 'Select profile type' },
    { value: 'brand', label: 'Brand' },
    { value: 'creator', label: 'Creator' },
    { value: 'project/campaign', label: 'Project/Campaign' },
    { value: 'app/software', label: 'App/Software' },
    { value: 'services', label: 'Services' },
    { value: 'location', label: 'Location' },
    { value: 'other', label: 'Other' },
  ];
  const snsChannelOptions = [
    { value: '', label: 'Select SNS channel' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'YouTube', label: 'YouTube' },
  ];
  const primaryObjectiveOptions = [
    { value: '', label: 'Select primary objective' },
    { value: 'Increase reach & followers', label: 'Increase reach & followers' },
    { value: 'Promote product, brand', label: 'Promote product, brand' },
    { value: 'Enhance engagement', label: 'Enhance engagement' },
    { value: 'Connect with people', label: 'Connect with people' },
    { value: 'Motivational, help others', label: 'Motivational, help others' },
    { value: 'Educate', label: 'Educate' },
    { value: 'Raise awareness', label: 'Raise awareness' },
  ];

  return (
    <Card className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">
        {step === 1
          ? 'Step 1 of 4: Basic Profile Info'
          : step === 2
          ? 'Step 2 of 4: Agent Chat'
          : step === 3
          ? 'Step 3 of 4: Review Your Profile'
          : 'Step 4 of 4: Your Insight Report'}
      </h1>
      {step === 1 ? (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
          <SelectField control={control} name="profile_type" label="Profile Type" options={profileTypeOptions} />
          <SelectField control={control} name="primary_sns_channel" label="Primary SNS Channel" options={snsChannelOptions} />
          {/* SNS Handle with dynamic prefix */}
          <div className="space-y-2 rounded-lg">
            <label htmlFor="sns_handle" className="text-sm font-medium">SNS Handle</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <span className="px-3 py-2 bg-gray-100 text-gray-500 whitespace-nowrap">
                {snsBaseUrlMap[watchChannel] || "https://"}
              </span>
              <Controller
                control={control}
                name="sns_handle"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id={field.name}
                      {...field}
                      placeholder="yourhandle"
                      className="flex-1 border-none focus:ring-0 focus:border-none"
                      disabled={loading}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-600">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          </div>
          <SelectField control={control} name="primary_objective" label="Primary Objective" options={primaryObjectiveOptions} />
          <TextInputField control={control} name="email" label="Email" placeholder="you@example.com" />
          <TextInputField control={control} name="follower_count" label="Follower Count" placeholder="0" />
          <TextInputField control={control} name="locale" label="Locale" placeholder="en-US" />
          <TextareaField control={control} name="comments" label="Comments" placeholder="Any additional info" />
          <Button type="submit">Next</Button>
        </form>
      ) : step === 2 ? (
        <div className="flex flex-col h-[70vh]">
          <Button variant="outline" size="sm" className="mb-2 w-fit" onClick={() => setStep(1)}>
            Back
          </Button>
          <div className="flex-1 overflow-y-auto border rounded p-4 space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded ${
                    msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="mt-2 flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded px-3 py-2"
              disabled={loading}
              autoFocus
            />
            <Button type="submit" disabled={loading}>
              Send
            </Button>
          </form>
        </div>
      ) : step === 3 ? (
        <div className="max-w-3xl mx-auto p-6">
          <h2 className="text-xl font-semibold mb-4">Review Your Profile</h2>
          <div className="overflow-x-auto border rounded p-4">
            <table className="table-auto w-full text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1 border-b">Field</th>
                  <th className="px-2 py-1 border-b">Value</th>
                  <th className="px-2 py-1 border-b">Edit</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(collectedFields).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-2 py-1 border-b">{key}</td>
                    <td className="px-2 py-1 border-b">{value || <em>(blank)</em>}</td>
                    <td className="px-2 py-1 border-b">
                      <button
                        className="text-blue-500 hover:underline"
                        onClick={async () => {
                          const newVal = prompt(`Edit ${key}`, value);
                          if (newVal !== null) {
                            setCollectedFields(prev => ({ ...prev, [key]: newVal }));
                            const { error } = await supabase
                              .from('agent_messages')
                              .insert([
                                {
                                  task_id: profile.id,
                                  user_id: session?.user?.id ?? "",
                                  agent_type: 'profilebuilder',
                                  message_type: 'profile_partial',
                                  message_content: { [key]: newVal },
                                  created_at: new Date().toISOString(),
                                },
                              ]);
                            if (error) console.error('Error updating field:', error);
                          }
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button className="mt-4" onClick={handleGenerate} disabled={reportLoading}>
            {reportLoading ? 'Generating your insight report...' : 'Generate Insight Report'}
          </Button>
        </div>
      ) : step === 4 && reportData ? (
        <ProfileInsightReport
          summary_markdown={reportData.summary_markdown}
          strengths={reportData.strengths}
          blindspots={reportData.blindspots}
          next_steps={reportData.next_steps}
        />
      ) : null}
    </Card>
  );
}