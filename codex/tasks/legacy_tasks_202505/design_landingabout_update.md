## codex/tasks/design_landingabout_update.md

🧠 Codex Task Template: Figma HTML → Next.js + Tailwind Components

📄 Task Title
Example: Refactor Figma Exported Header and Hero to React/Tailwind Components

**Do not simply translate the HTML.**
Instead:
- Refactor it into a semantic, responsive React component using Tailwind CSS.
- Do NOT use hardcoded widths (like w-[1280px]) or absolute positioning.
- Use a max-width centered container (e.g. max-w-[1200px] mx-auto px-4) for the overall header.
- Place the logo ("rightNOW") left, and navigation links ("About", "Sign-Up/Login") on the right using flex.
- Make the nav links visually balanced, spaced, and align to the baseline of the logo if possible.
- Use <Link> from next/link for navigation.
- Use Tailwind classes for spacing, alignment, and font.
- Assume the font (Instrument Sans) is set globally, not inline.
- Output only the final React component code (e.g. NavHeader.tsx).
- No explanations, just the code.


**Figma-exported code starts here:**

below is the nav-header specifically for index and about page. this specific code you can apply as reusable component but ONLY for the index and about page. (not global)

<div data-size="Desktop" class="w-[1280px] h-11 px-3.5 left-0 top-0 absolute bg-white inline-flex justify-start items-center">
    <div class="flex-1 self-stretch pr-5 pt-3 pb-2.5 border-b border-black flex justify-start items-center gap-2.5">
        <div class="justify-start text-black text-xl font-normal font-['Instrument_Sans'] leading-normal">rightNOW</div>
    </div>
    <div class="flex-1 self-stretch max-w-[615px] flex justify-end items-start gap-48">
        <div class="flex-1 self-stretch pl-5 pt-3 pb-2.5 bg-white border-b border-black flex justify-end items-end gap-12">
            <div data-property-1="Default" class="pb-1 flex justify-center items-center gap-2.5">
                <div class="justify-start text-white text-xl font-normal font-['Instrument_Sans'] leading-tight">Work</div>
            </div>
            <div data-property-1="Default" class="pb-1 flex justify-center items-center gap-2.5">
                <div class="justify-start text-neutral-950 text-xl font-normal font-['Instrument_Sans'] leading-tight">About</div>
            </div>
            <div data-property-1="Default" class="pb-1 flex justify-center items-center gap-2.5">
                <div class="justify-start text-neutral-950 text-xl font-normal font-['Instrument_Sans'] leading-tight">Sign-Up/Login</div>
            </div>
        </div>
    </div>
</div>

the same for the footer design code below, apply ONLY for the index and about page. 

<div class="w-full max-w-[1920px] px-3.5 pt-7 pb-3.5 inline-flex flex-col justify-start items-start gap-32">
    <div class="self-stretch inline-flex justify-start items-start">
        <div class="flex-1 max-w-[625px] inline-flex flex-col justify-start items-start gap-2.5">
            <div class="w-14 h-14 relative overflow-hidden">
                <div class="w-14 h-14 left-0 top-0 absolute bg-black"></div>
            </div>
            <div class="w-4 h-4 bg-black rounded-full"></div>
            <div class="w-4 h-4 bg-black rounded-full"></div>
            <div class="w-4 h-4 origin-top-left -rotate-90 bg-black rounded-full"></div>
            <div class="w-4 h-4 origin-top-left -rotate-90 bg-black rounded-full"></div>
            <div class="w-4 h-4 origin-top-left rotate-[-135deg] bg-black rounded-full"></div>
            <div class="w-4 h-4 origin-top-left rotate-[-135deg] bg-black rounded-full"></div>
            <div class="w-8 h-0 origin-top-left -rotate-45 bg-black rounded-full"></div>
            <div class="w-4 h-4 origin-top-left -rotate-45 bg-black rounded-full"></div>
        </div>
        <div class="w-[616px] flex justify-between items-start">
            <div class="w-56 inline-flex flex-col justify-start items-start gap-16">
                <div class="w-52 flex flex-col justify-start items-start gap-7">
                    <div class="self-stretch justify-start text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">OFFICE</div>
                    <div class="self-stretch justify-start text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">Donggyo-Ro 272-8 3F Seoul, Korea</div>
                </div>
                <div class="self-stretch flex flex-col justify-start items-start gap-7">
                    <div class="self-stretch justify-start text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">CONTACT</div>
                    <div class="self-stretch flex flex-col justify-start items-start gap-2.5">
                        <div class="self-stretch justify-start text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">contactus@rgtnow.com</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="self-stretch h-40 flex flex-col justify-start items-start gap-2.5">
        <div class="justify-start text-black text-8xl font-normal font-['Instrument_Sans'] leading-[115.50px]">rightNOW</div>
    </div>
</div>