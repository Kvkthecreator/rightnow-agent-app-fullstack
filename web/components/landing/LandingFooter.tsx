"use client";
import { ArrowElbowRight } from "phosphor-react";
import Brand from "@/components/Brand";

export default function LandingFooter() {
    return (
        <footer className="bg-white text-black border-t border-neutral-200 py-8 px-4">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Logo/Icon and Brand */}
                <div className="flex items-center gap-3">
                    <ArrowElbowRight size={28} className="text-black" />
                    <Brand className="text-lg tracking-tight" />
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
                            contactus@rgtnow.com
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
