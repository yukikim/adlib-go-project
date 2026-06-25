'use client';

import Image from 'next/image';
// import { useEffect, useRef } from 'react';

export function HeroSection() {

    return (
        <div className="relative p-0 lg:p-10" id="hero-section">
            <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 -space-x-52">
                <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 opacity-40"></div>
                <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 opacity-40"></div>
                <div className="absolute left-[12%] top-[-0%] lg:left-[24%] lg:top-[-0%] animate__fadeInLeft animate__animated">
                    <Image
                        src='/images/main_logo.svg'
                        alt="Hero Image"
                        width={600}
                        height={200}
                        loading="eager"
                        className="opacity-100 w-[340px] lg:w-[600px]"
                        style={{ height: 'auto', width: 'auto' }}
                    />
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div className="relative pt-26 lg:pt-32 ml-auto">
                    <div className="lg:w-2/3 text-center mx-auto">
                        <h1 className="text-primary text-balance font-bold text-5xl md:text-6xl xl:text-7xl animate__lightSpeedInRight animate__animated">
                            Website for groups that <span className="text-accent"> enjoy jazz sessions.</span>
                        </h1>
                        <p className="mt-8 text-2xl text-secondary">Join us for an immersive jazz experience.</p>

                        {/* <div className="hidden py-8 mt-16 border-y border-gray-100 sm:flex justify-between">
                            <div className="text-left">
                                <h6 className="text-lg font-semibold text-gray-700">The lowest price</h6>
                                <p className="mt-2 text-gray-500">Some text here</p>
                            </div>
                            <div className="text-left">
                                <h6 className="text-lg font-semibold text-gray-700">The fastest on the market</h6>
                                <p className="mt-2 text-gray-500">Some text here</p>
                            </div>
                            <div className="text-left">
                                <h6 className="text-lg font-semibold text-gray-700">The most loved</h6>
                                <p className="mt-2 text-gray-500">Some text here</p>
                            </div>
                        </div> */}
                    </div>

                </div>
            </div>
        </div>
    );
}
