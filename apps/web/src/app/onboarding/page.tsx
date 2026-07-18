"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Store, AtSign } from "lucide-react";
import { shopsApi } from "@/lib/api";

const schema = z.object({
  name: z.string().min(3, "حداقل ۳ کاراکتر").max(60, "حداکثر ۶۰ کاراکتر"),
  slug: z
    .string()
    .min(3, "حداقل ۳ کاراکتر")
    .max(30, "حداکثر ۳۰ کاراکتر")
    .regex(/^[a-z0-9_-]+$/, "فقط حروف انگلیسی کوچک، عدد، - و _"),
  bio: z.string().max(250).optional(),
});

type Form = z.infer<typeof schema>;

export default function OnboardingPage() {
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const checkSlug = async (slug: string) => {
    if (slug.length < 3) return;
    setSlugStatus("checking");
    try {
      const res = await shopsApi.checkSlug(slug) as any;
      setSlugStatus(res.available ? "ok" : "taken");
    } catch {
      setSlugStatus("idle");
    }
  };

  const onSubmit = async (data: Form) => {
    if (slugStatus === "taken") return toast.error("این آدرس قبلاً گرفته شده");
    setLoading(true);
    try {
      await shopsApi.create(data);
      toast.success("فروشگاه ایجاد شد!");
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e?.message || "خطا در ایجاد فروشگاه");
    } finally {
      setLoading(false);
    }
  };

  const slug = watch("slug") || "";

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]
                        bg-orange-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.35)] mb-5">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">فروشگاهت رو بساز</h1>
          <p className="text-gray-500 mt-2 text-sm">
            آدرس اختصاصی انتخاب کن — بعداً هم می‌تونی تغییرش بدی
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                نام فروشگاه
              </label>
              <input
                {...register("name")}
                placeholder="مثلاً: فروشگاه مد تهران"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder:text-gray-600 focus:outline-none
                           focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                آدرس اختصاصی
              </label>
              <div className="relative flex items-center">
                <span className="absolute right-3.5 flex items-center gap-1 text-gray-600 text-sm">
                  <AtSign className="w-4 h-4" />
                </span>
                <input
                  {...register("slug", {
                    onChange: (e) => checkSlug(e.target.value),
                  })}
                  placeholder="myshop"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder:text-gray-600 focus:outline-none text-left
                             focus:border-orange-500/50 transition-all font-mono text-sm"
                  dir="ltr"
                />
                <div className="absolute left-3">
                  {slugStatus === "checking" && (
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                  )}
                  {slugStatus === "ok" && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                  {slugStatus === "taken" && (
                    <span className="text-xs text-red-400">گرفته شده</span>
                  )}
                </div>
              </div>
              {slug && (
                <p className="mt-1.5 text-xs text-gray-600 font-mono" dir="ltr">
                  weeelink.ir/<span className="text-orange-400">{slug}</span>
                </p>
              )}
              {errors.slug && (
                <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                بیو / توضیحات
                <span className="text-gray-600 font-normal mr-1">(اختیاری)</span>
              </label>
              <textarea
                {...register("bio")}
                rows={3}
                placeholder="فروش لباس زنانه | تهران | ارسال سراسری"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder:text-gray-600 focus:outline-none resize-none
                           focus:border-orange-500/50 transition-all text-sm leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading || slugStatus === "taken"}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                         bg-orange-500 hover:bg-orange-400 text-white font-bold
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  ایجاد فروشگاه
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
