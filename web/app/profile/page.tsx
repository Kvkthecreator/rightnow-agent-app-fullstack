import { getSupabaseAdmin } from "@/lib/supabaseServerClient";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from("profile_core_data")
    .select("*")
    .single();

  if (error || !profile) {
    redirect('/profile/create');
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>
      <pre className="bg-white p-4 rounded shadow">{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

type Profile = {
  id: string;
  profile_type: string;
  sns_url: string;
  primary_objective: string;
  follower_count: number;
  locale: string;
  email: string;
  report_markdown?: string;
  [key: string]: any;
};

type Section = {
  id: string | null;
  title: string;
  body: string;
  isSaving: boolean;
  isDeleting: boolean;
};

export default function ProfilePage() {
  const supabase = useSupabaseClient();
  const { session, isLoading } = useSessionContext();
  const router = useRouter();
  // Global edit mode toggle
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!session) return;
    fetchProfile();
  }, [session, isLoading]);

  async function fetchProfile() {
    if (!session) {
      console.error("Error fetching profile: no session.");
      return;
    }
    const { data: fetchedProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }
    // if no profile, redirect to creation page
    if (!fetchedProfile) {
      router.push('/profile-create');
      return;
    }
    setProfile(fetchedProfile);
    fetchSections(fetchedProfile.id);
  }

  async function fetchSections(profileId: string) {
    const { data, error } = await supabase
      .from("profile_report_sections")
      .select("*")
      .eq("profile_id", profileId)
      .order("id", { ascending: true });
    if (error) {
      console.error("Error fetching sections:", error);
      return;
    }
    const sectionStates: Section[] = (data || []).map((sec: any) => ({
      id: sec.id,
      title: sec.title,
      body: sec.body,
      isSaving: false,
      isDeleting: false,
    }));
    setSections(sectionStates);
  }

  async function handleSaveSection(index: number) {
    const sec = sections[index];
    updateSectionState(index, { isSaving: true });
    if (sec.id) {
      const { error } = await supabase
        .from("profile_report_sections")
        .update({ title: sec.title, body: sec.body })
        .eq("id", sec.id);
      if (error) {
        console.error("Error updating section:", error);
        alert("Failed to update section.");
      }
    } else if (profile) {
      const { data, error } = await supabase
        .from("profile_report_sections")
        .insert({ profile_id: profile.id, title: sec.title, body: sec.body })
        .select()
        .single();
      if (error) {
        console.error("Error creating section:", error);
        alert("Failed to create section.");
      } else if (data) {
        updateSectionState(index, { id: data.id });
      }
    }
    updateSectionState(index, { isSaving: false });
  }

  async function handleDeleteSection(index: number) {
    const sec = sections[index];
    if (sec.id) {
      const { error } = await supabase
        .from("profile_report_sections")
        .delete()
        .eq("id", sec.id);
      if (error) {
        console.error("Error deleting section:", error);
        alert("Failed to delete section.");
        return;
      }
    }
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddSection() {
    if (!profile) return;
    const { data, error } = await supabase
      .from("profile_report_sections")
      .insert({ profile_id: profile.id, title: "", body: "" })
      .select()
      .single();
    if (error) {
      console.error("Error creating section:", error);
      alert("Failed to create section.");
    } else if (data) {
      setSections((prev) => [
        ...prev,
        { id: data.id, title: data.title, body: data.body, isSaving: false, isDeleting: false },
      ]);
    }
  }

  function updateSectionState(index: number, updates: Partial<Section>) {
    setSections((prev) => {
      const newSections = [...prev];
      newSections[index] = { ...newSections[index], ...updates };
      return newSections;
    });
  }

  // Cancel inline edits by reloading sections
  function handleCancelSection(index: number) {
    if (profile) {
      fetchSections(profile.id);
    }
  }

  function handleExportMarkdown() {
    if (!profile?.report_markdown) {
      alert("No report markdown available to export.");
      return;
    }
    const blob = new Blob([profile.report_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile_report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return null;
  }

  // Redirect to login if not signed in
  if (!session || !session.user) {
    router.replace('/login');
    return <div>Redirecting to login...</div>;
  }

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Your Profile</h1>
        <Button variant="outline" onClick={() => setEditMode(!editMode)}>
          {editMode ? "View Profile" : "Edit Profile"}
        </Button>
      </div>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Profile Type:</span> {profile.profile_type}
          </div>
          <div>
            <span className="font-medium">SNS URL:</span>{" "}
            <a
              href={profile.sns_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground underline hover:underline"
            >
              {profile.sns_url}
            </a>
          </div>
          <div>
            <span className="font-medium">Primary Objective:</span>{" "}
            {profile.primary_objective}
          </div>
          <div>
            <span className="font-medium">Follower Count:</span> {profile.follower_count}
          </div>
          <div>
            <span className="font-medium">Locale:</span> {profile.locale}
          </div>
          <div>
            <span className="font-medium">Email:</span> {profile.email}
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <Button onClick={handleExportMarkdown}>Export Markdown</Button>
        </div>
      </Card>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Report Sections</h2>
        <Button onClick={handleAddSection}>New Section</Button>
      </div>
      <div className="space-y-4">
        {sections.map((sec, index) => (
          <Card key={sec.id ?? `new-${index}`}> 
            {!editMode ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{sec.title}</h3>
                <p className="text-base">{sec.body}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <InputInline
                      value={sec.title}
                      onChange={(e) =>
                        updateSectionState(index, { title: e.target.value })
                      }
                      disabled={sec.isSaving}
                      className="w-full text-base text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <TextareaInline
                      value={sec.body}
                      onChange={(e) =>
                        updateSectionState(index, { body: e.target.value })
                      }
                      disabled={sec.isSaving}
                      rows={4}
                      className="w-full text-base text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCancelSection(index)}
                    disabled={sec.isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveSection(index)}
                    disabled={sec.isSaving}
                  >
                    Save
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}