"use client";
import Link from "next/link";
import { ArrowElbowRight } from "phosphor-react";
import Brand from "@/components/Brand";

export default function LandingFooter() {
    return (
        <footer className="bg-white text-black border-t border-neutral-200 py-8 px-4">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Logo/Icon and Brand */}
                <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-3">
                        <div className="font-brand mb-1">yarnnn</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <Link href="/docs" className="hover:underline">
                            Documentation
                        </Link>
                        <Link href="/privacy" className="hover:underline">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:underline">
                            Terms
                        </Link>
                    </div>
                </div>

                {/* Office & Contact */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12 text-sm">
                    <div>
                        <div className="font-medium mb-1">Office</div>
                        <div className="text-neutral-700">
                            Donggyo-Ro 272-8 3F, Seoul, Korea
                        </div>
                    </div>
                    <div>
                        <div className="font-medium mb-1">Contact</div>
                        <div className="text-neutral-700">
                            contactus@yarnnn.com
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
