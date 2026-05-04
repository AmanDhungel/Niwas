"use client";
import React, { useState } from "react";
import { Play, X } from "lucide-react";

const PropertyVideo = ({ data }: { data: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = data?.media_and_files?.property_videos?.[0]?.url;
  const posterUrl = data?.media_and_files?.property_photos?.[0]?.url;

  if (!videoUrl) return null;

  return (
    <section className="mt-12">
      <h3 className="text-2xl font-bold text-[#ff6b35] mb-6">Property Video</h3>

      <div className="relative aspect-video rounded-3xl overflow-hidden group bg-black shadow-xl">
        {!isPlaying ? (
          /* --- THUMBNAIL / OVERLAY STATE --- */
          <div
            className="relative w-full h-full cursor-pointer"
            onClick={() => setIsPlaying(true)}>
            <img
              src={posterUrl || "/api/placeholder/800/450"}
              alt="Video Preview"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
              <div className="w-20 h-20 bg-[#ff6b35]/90 text-white rounded-full flex items-center justify-center border-4 border-white shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                <Play fill="white" size={32} className="ml-1" />
              </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-6 left-8 text-white">
              <p className="text-sm uppercase tracking-widest font-semibold opacity-80">
                Virtual Tour
              </p>
              <h4 className="text-xl font-bold">{data.basic_info?.name}</h4>
            </div>
          </div>
        ) : (
          /* --- ACTIVE PLAYER STATE --- */
          <div className="relative w-full h-full bg-black">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full"
              poster={posterUrl}>
              Your browser does not support the video tag.
            </video>

            {/* Close Button to return to thumbnail */}
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black text-white p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyVideo;
