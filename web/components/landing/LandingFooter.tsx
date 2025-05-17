import React from 'react';
import { ArrowElbowRight } from 'phosphor-react';

export default function LandingFooter() {
  return (
    <footer className="w-full bg-white">
      <div className="w-full max-w-[1920px] px-3.5 pt-7 pb-3.5 mx-auto inline-flex flex-col justify-start items-start gap-32">
        <div className="self-stretch inline-flex justify-start items-start w-full">
          {/* Decorative Shapes Column */}
          <div className="flex-1 max-w-[625px] inline-flex flex-col justify-start items-start gap-2.5">
            <div className="w-14 h-14 relative overflow-hidden">
              <div className="w-14 h-14 absolute left-0 top-0 bg-black" />
            </div>
            <div className="w-4 h-4 bg-black rounded-full" />
            <div className="w-4 h-4 bg-black rounded-full" />
            <div className="w-4 h-4 origin-top-left -rotate-90 bg-black rounded-full" />
            <div className="w-4 h-4 origin-top-left -rotate-90 bg-black rounded-full" />
            <div className="w-4 h-4 origin-top-left rotate-[-135deg] bg-black rounded-full" />
            <div className="w-4 h-4 origin-top-left rotate-[-135deg] bg-black rounded-full" />
            <div className="w-8 h-0 origin-top-left -rotate-45 bg-black rounded-full" />
            <div className="w-4 h-4 origin-top-left -rotate-45 bg-black rounded-full" />
          </div>
          {/* Contact Information Column */}
          <div className="w-[616px] flex justify-between items-start">
            <div className="w-56 inline-flex flex-col justify-start items-start gap-16">
              <div className="w-52 flex flex-col justify-start items-start gap-7">
                <div className="text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">OFFICE</div>
                <div className="text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">Donggyo-Ro 272-8 3F Seoul, Korea</div>
              </div>
              <div className="flex flex-col justify-start items-start gap-7">
                <div className="text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">CONTACT</div>
                <div className="flex flex-col justify-start items-start gap-2.5">
                  <div className="text-black text-xl font-normal font-['Instrument_Sans'] leading-tight">contactus@rgtnow.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Brand Logo/Icon */}
        <div className="self-stretch h-40 flex flex-col justify-start items-start gap-2.5">
          <ArrowElbowRight size={96} className="text-black" />
        </div>
      </div>
    </footer>
  );
}