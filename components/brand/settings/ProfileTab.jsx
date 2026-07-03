import React, { useState } from "react";
import Image from "next/image";
import { Camera, Lock, Star, Loader2, Video, Sparkles, Info, AtSign, X } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAIUsage } from "@/lib/aiUsageStore";

export default function ProfileTab({ profile, setProfile, setIsDirty }) {
  const { isPro, getRemainingForTool, triggerGeneration, incrementUsage } = useAIUsage();

  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  const [videoInputs, setVideoInputs] = useState({
    category: profile.category || "Ceramics",
    mood: "",
    productName: "",
  });

  const [storyInputs, setStoryInputs] = useState({
    materials: "",
    inspiration: "",
    tone: "Warm",
  });

  const [tagsInputs, setTagsInputs] = useState({
    category: profile.category || "Ceramics",
    aesthetic: "",
  });
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [tagsGenerated, setTagsGenerated] = useState(false);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

  const handleOpenVideoModal = () => {
    if (triggerGeneration('banner-video')) {
      setShowVideoModal(true);
    }
  };

  const handleOpenStoryModal = () => {
    if (triggerGeneration('brand-story')) {
      setShowStoryModal(true);
    }
  };

  const handleOpenTagsModal = () => {
    if (triggerGeneration('recommendation-tags')) {
      setShowTagsModal(true);
    }
  };

  const renderVideoModal = () => {
    if (!showVideoModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative border border-brand-border/30">
          <button 
            onClick={() => setShowVideoModal(false)} 
            className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-dark">Generate AI Video</h3>
            <p className="text-xs text-brand-muted mt-1">Configure your mock AI video generation settings</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Category</label>
              <select
                value={videoInputs.category}
                onChange={e => setVideoInputs(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
              >
                <option value="Ceramics">Ceramics</option>
                <option value="Woodwork">Woodwork</option>
                <option value="Textiles">Textiles</option>
                <option value="Apothecary">Apothecary</option>
                <option value="Lighting">Lighting</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Mood / Style</label>
              <Input
                placeholder="e.g. calm and slow, energetic and bold"
                value={videoInputs.mood}
                onChange={e => setVideoInputs(prev => ({ ...prev, mood: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Product to Feature (Optional)</label>
              <Input
                placeholder="e.g. Speckled Clay Teacup"
                value={videoInputs.productName}
                onChange={e => setVideoInputs(prev => ({ ...prev, productName: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 justify-center text-brand-dark" onClick={() => setShowVideoModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 justify-center" 
              onClick={() => {
                setShowVideoModal(false);
                setIsGeneratingVideo(true);
                setTimeout(() => {
                  setProfile(p => ({
                    ...p,
                    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-potter-working-on-a-pottery-wheel-41711-large.mp4"
                  }));
                  setIsDirty(true);
                  setIsGeneratingVideo(false);
                  incrementUsage('banner-video');
                }, 1200);
              }}
            >
              Generate Video
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderStoryModal = () => {
    if (!showStoryModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative border border-brand-border/30">
          <button 
            onClick={() => setShowStoryModal(false)} 
            className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-dark">Generate Brand Story</h3>
            <p className="text-xs text-brand-muted mt-1">Configure your AI narrative inputs</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Core Materials / Craft Type</label>
              <Input
                placeholder="e.g. natural clay, reclaimed walnut, linen weaving"
                value={storyInputs.materials}
                onChange={e => setStoryInputs(prev => ({ ...prev, materials: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Inspiration / Style Keywords</label>
              <Input
                placeholder="e.g. wabi-sabi, mid-century modern, slow living"
                value={storyInputs.inspiration}
                onChange={e => setStoryInputs(prev => ({ ...prev, inspiration: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Tone</label>
              <select
                value={storyInputs.tone}
                onChange={e => setStoryInputs(prev => ({ ...prev, tone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
              >
                <option value="Warm">Warm</option>
                <option value="Minimal">Minimal</option>
                <option value="Artisanal">Artisanal</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 justify-center text-brand-dark" onClick={() => setShowStoryModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 justify-center" 
              onClick={() => {
                setShowStoryModal(false);
                setIsGeneratingStory(true);
                setTimeout(() => {
                  setProfile(p => ({
                    ...p,
                    description: "Rooted in the slow rhythms of Kyoto's ceramic district and the rugged forests of the Pacific Northwest, Ochre Clay Studio exists at the intersection of ancient technique and quiet modernity.\n\nEvery piece we make — from a whisper-thin tea bowl to a full dinner service — carries the imprint of hands, time, and fire. We don't chase trends. We chase that specific gravity that makes you pick up a mug and hold it just a little longer than you planned."
                  }));
                  setIsDirty(true);
                  setIsGeneratingStory(false);
                  incrementUsage('brand-story');
                }, 1500);
              }}
            >
              Generate Story
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderTagsModal = () => {
    if (!showTagsModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative border border-brand-border/30">
          <button 
            onClick={() => {
              setShowTagsModal(false);
              setSuggestedTags([]);
              setTagsGenerated(false);
            }} 
            className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-dark">Generate AI Recommendation Tags</h3>
            <p className="text-xs text-brand-muted mt-1">Configure your target tag suggestions</p>
          </div>

          {!tagsGenerated ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Primary Category</label>
                <Input
                  placeholder="e.g. Ceramics, Textiles"
                  value={tagsInputs.category}
                  onChange={e => setTagsInputs(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Aesthetic / Values (2-3 keywords)</label>
                <Input
                  placeholder="e.g. minimalist, organic, rustic, cozy"
                  value={tagsInputs.aesthetic}
                  onChange={e => setTagsInputs(prev => ({ ...prev, aesthetic: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center text-brand-dark" 
                  onClick={() => setShowTagsModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 justify-center" 
                  onClick={(e) => {
                    e.preventDefault();
                    const allowed = triggerGeneration('recommendation-tags');
                    if (!allowed) {
                      setShowTagsModal(false);
                      return;
                    }
                    setIsGeneratingTags(true);
                    setTimeout(() => {
                      const baseTags = ["handmade", "artisan", "slow living", "wabi-sabi"];
                      const userAesthetic = tagsInputs.aesthetic.split(",")
                        .map(s => s.trim().toLowerCase())
                        .filter(Boolean);
                      const generated = Array.from(new Set([
                        tagsInputs.category.toLowerCase().trim(),
                        ...userAesthetic,
                        ...baseTags
                      ])).slice(0, 8);

                      setSuggestedTags(generated);
                      setTagsGenerated(true);
                      setIsGeneratingTags(false);
                      incrementUsage('recommendation-tags');
                    }, 1200);
                  }}
                  disabled={isGeneratingTags}
                >
                  {isGeneratingTags ? "Generating..." : "Generate Suggestions"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-brand-dark mb-1">
                AI Suggested Tags (Review & remove options before adding):
              </p>
              
              <div className="flex flex-wrap gap-2 p-3 bg-brand-border/10 border border-brand-border/40 rounded-2xl min-h-[80px]">
                {suggestedTags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold"
                  >
                    #{tag}
                    <button 
                      onClick={() => setSuggestedTags(prev => prev.filter(t => t !== tag))}
                      className="w-3.5 h-3.5 rounded-full bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary flex items-center justify-center text-[10px]"
                      title="Remove tag"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {suggestedTags.length === 0 && (
                  <p className="text-xs text-brand-muted italic flex items-center justify-center w-full">
                    No tags remaining.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  className="flex-1 text-center text-xs font-bold text-brand-muted hover:text-brand-dark py-2.5 transition-colors"
                  onClick={() => {
                    setTagsGenerated(false);
                    setSuggestedTags([]);
                  }}
                >
                  ← Back
                </button>
                <Button 
                  variant="primary" 
                  className="flex-1 justify-center" 
                  onClick={() => {
                    setProfile(p => ({
                      ...p,
                      tags: suggestedTags.join(", ")
                    }));
                    setIsDirty(true);
                    setShowTagsModal(false);
                    setSuggestedTags([]);
                    setTagsGenerated(false);
                  }}
                  disabled={suggestedTags.length === 0}
                >
                  Add selected tags
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {renderVideoModal()}
      {renderStoryModal()}
      {renderTagsModal()}

      {/* Logo & Basic Info */}
      <div className="bg-white rounded-2xl border border-brand-border/50 p-6">
        <h3 className="font-serif text-lg font-bold text-brand-dark mb-4">Brand Identity</h3>
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-brand-border/50 group bg-brand-border/10">
              <Image 
                src="https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80" 
                alt="Brand Logo" 
                fill 
                className="object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
              </div>
            </div>
            
            <div className="bg-brand-border/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-brand-border/40" title="Computed from customer ratings — cannot be edited">
              <Lock className="w-3 h-3 text-brand-muted" />
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-brand-dark">{profile.rating}</span>
              <span className="text-[10px] text-brand-muted font-medium">({profile.reviews})</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Brand Name" name="name" value={profile.name} onChange={handleProfileChange} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Category</label>
                <select 
                  name="category"
                  value={profile.category}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
                >
                  <option value="Ceramics">Ceramics</option>
                  <option value="Woodwork">Woodwork</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Apothecary">Apothecary</option>
                  <option value="Lighting">Lighting</option>
                </select>
              </div>
              <Input label="Location" name="location" value={profile.location} onChange={handleProfileChange} />
              
              <div className="md:col-span-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Banner Video URL</label>
                    <button 
                      onClick={handleOpenVideoModal}
                      disabled={isGeneratingVideo}
                      className="text-xs font-bold text-brand-primary flex items-center gap-1.5 hover:text-brand-dark transition-colors disabled:opacity-50"
                    >
                      {isGeneratingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />} 
                      {isGeneratingVideo ? "Generating..." : "Generate AI Video"}
                      <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-semibold">
                        {getRemainingForTool('banner-video')} free left
                      </span>
                    </button>
                  </div>
                  <input
                    type="url"
                    name="videoUrl"
                    value={profile.videoUrl}
                    onChange={handleProfileChange}
                    placeholder="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
                  />
                  <p className="text-[10px] text-brand-muted mt-1.5">
                    Example to copy: <span className="select-all underline">https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4</span>
                  </p>
                  {profile.videoUrl ? (
                    <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden bg-black/5 border border-brand-border/40 group">
                      <video 
                        key={profile.videoUrl}
                        src={profile.videoUrl} 
                        className="w-full h-full object-cover" 
                        controls 
                        muted 
                        loop 
                        playsInline
                      />
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col items-center justify-center w-full h-32 rounded-xl border border-dashed border-brand-border bg-brand-border/10 text-brand-muted">
                      <Video className="w-6 h-6 mb-2 opacity-40" />
                      <span className="text-xs font-medium">No banner video yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* About the Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/80 block">
                    About the Brand (Brand Story)
                  </label>
                  <button 
                    onClick={handleOpenStoryModal}
                    disabled={isGeneratingStory}
                    className="text-xs font-bold text-brand-primary flex items-center gap-1.5 hover:text-brand-dark transition-colors disabled:opacity-50"
                  >
                    {isGeneratingStory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} 
                    {isGeneratingStory ? "Generating..." : "Generate Story with AI"}
                    <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-semibold">
                      {getRemainingForTool('brand-story')} free left
                    </span>
                  </button>
                </div>
                <textarea
                  name="description"
                  value={profile.description}
                  onChange={handleProfileChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI & Discovery */}
      <div className="bg-white rounded-2xl border border-brand-border/50 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-lg font-bold text-brand-dark">AI Recommendation Tags</h3>
          <button 
            onClick={handleOpenTagsModal}
            disabled={isGeneratingTags}
            className="text-xs font-bold text-brand-primary flex items-center gap-1.5 hover:text-brand-dark transition-colors disabled:opacity-50"
          >
            {isGeneratingTags ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} 
            {isGeneratingTags ? "Analyzing..." : "Generate Tags"}
            <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-semibold">
              {getRemainingForTool('recommendation-tags')} free left
            </span>
          </button>
        </div>
        <p className="text-xs text-brand-muted mb-4 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          These tags power our AI creator matching and customer discovery feed. Generate them automatically based on your brand story.
        </p>
        <Input 
          name="tags" 
          value={profile.tags} 
          onChange={handleProfileChange} 
          placeholder="Comma separated (e.g. eco-friendly, handmade, neutral)" 
        />
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-2xl border border-brand-border/50 p-6">
        <h3 className="font-serif text-lg font-bold text-brand-dark mb-4">Social Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <AtSign className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <Input name="instagram" value={profile.instagram} onChange={handleProfileChange} placeholder="@handle" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>
            </div>
            <div className="flex-1">
              <Input name="tiktok" value={profile.tiktok} onChange={handleProfileChange} placeholder="@handle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
