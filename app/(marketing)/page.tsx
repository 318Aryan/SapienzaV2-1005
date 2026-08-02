import Image from "next/image";
import Link from "next/link";
import { FileText, Flame, GraduationCap, Loader, Sparkles, Trophy, TrendingUp, Upload, Users } from "lucide-react";
import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FEATURES = [
  {
    icon: FileText,
    tone: "bg-sky-100 text-sky-500",
    title: "AI-generated lessons",
    description: "Paste notes or upload a PDF — get a full quiz with concepts and flashcards in seconds.",
  },
  {
    icon: Flame,
    tone: "bg-amber-100 text-amber-600",
    title: "Gamified learning",
    description: "XP, streaks, and hearts keep students coming back — not another worksheet to dread.",
  },
  {
    icon: TrendingUp,
    tone: "bg-rose-100 text-rose-500",
    title: "Real mastery tracking",
    description: "See which concepts students actually understand, down to the individual question.",
  },
  {
    icon: Users,
    tone: "bg-green-100 text-green-500",
    title: "Built for classrooms",
    description: "Join codes, assignments, and a gradebook — not a repurposed consumer app.",
  },
];

const STEPS = [
  {
    icon: Upload,
    step: "1",
    title: "Upload material",
    description: "Paste notes or drop in a PDF — no formatting or setup needed.",
  },
  {
    icon: Sparkles,
    step: "2",
    title: "AI builds the lesson",
    description: "Concepts, quiz questions, and flashcards are generated automatically.",
  },
  {
    icon: Trophy,
    step: "3",
    title: "Students learn & compete",
    description: "XP, streaks, and hearts keep them coming back to finish it.",
  },
];

const FAQS = [
  {
    question: "Is SapienzaV2 free to use?",
    answer: "Yes. Both students and teachers can get started for free, no credit card required. Teachers can optionally upgrade for unlimited classes and AI-generated content.",
  },
  {
    question: "Do I need to know how to code to create a class?",
    answer: "No. As a teacher, you just paste in notes or upload a PDF — the AI identifies the key concepts and builds the quiz for you.",
  },
  {
    question: "What subjects are available right now?",
    answer: "Python, JavaScript, Web Development, SQL, and Java ship out of the box, and teachers can generate lessons on any topic from their own material.",
  },
  {
    question: "Can I see how my students are actually doing?",
    answer: "Yes — teachers get concept-level mastery tracking, an at-risk student list, and a full assignment gradebook, not just a final score.",
  },
];

const SUBJECTS = [
  { title: "Python Fundamentals", imageSrc: "/python.svg", description: "Variables, data types, conditionals, and loops." },
  { title: "JavaScript Basics", imageSrc: "/javascript.svg", description: "Functions, arrays, objects, and the DOM." },
  { title: "Web Development", imageSrc: "/webdev.svg", description: "HTML structure, forms, and CSS layout." },
  { title: "SQL & Databases", imageSrc: "/sql.svg", description: "Queries, filtering, joins, and aggregation." },
  { title: "Java Fundamentals", imageSrc: "/java.svg", description: "Types, control flow, and core syntax." },
];

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero */}
      <section className="max-w-[988px] mx-auto w-full flex flex-col lg:flex-row items-center justify-center px-4 pt-10 pb-16 gap-8 lg:gap-4">
        <div className="relative w-[220px] h-[220px] lg:w-[380px] lg:h-[380px] shrink-0">
          <Image src="/hero.svg" fill alt="Hero" priority />
        </div>
        <div className="flex flex-col items-center lg:items-start gap-y-6 text-center lg:text-left">
          <span className="text-xs font-bold uppercase tracking-wide text-sky-600 bg-sky-100 rounded-full px-3 py-1">
            AI-powered classroom learning
          </span>
          <h1 className="text-2xl lg:text-4xl font-bold text-neutral-700 max-w-[520px]">
            AI-generated lessons. Duolingo-style motivation. Built for real classrooms.
          </h1>
          <p className="text-neutral-500 text-base lg:text-lg max-w-[480px]">
            Teachers turn any PDF into a quiz in seconds. Students learn through streaks, XP,
            and hearts — and actually finish the lesson.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-y-3 gap-x-3 max-w-[420px] w-full">
            <ClerkLoading>
              <Loader className="h-5 w-5 text-muted-foreground animate-spin" />
            </ClerkLoading>
            <ClerkLoaded>
              <SignedOut>
                <SignUpButton mode="modal" afterSignInUrl="/home" afterSignUpUrl="/home">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal" afterSignInUrl="/home" afterSignUpUrl="/home">
                  <Button size="lg" variant="primaryOutline" className="w-full sm:w-auto">
                    I already have an account
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
                  <Link href="/home">Continue Learning</Link>
                </Button>
              </SignedIn>
            </ClerkLoaded>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="w-full bg-neutral-50 py-16 px-4">
        <div className="max-w-[988px] mx-auto">
          <h2 className="text-center text-2xl font-bold text-neutral-700 mb-10">
            Everything a classroom actually needs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="border-2 border-b-4 rounded-xl p-5 bg-white flex flex-col gap-y-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${feature.tone}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <p className="font-bold text-neutral-700">{feature.title}</p>
                <p className="text-sm text-neutral-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16 px-4">
        <div className="max-w-[988px] mx-auto">
          <h2 className="text-center text-2xl font-bold text-neutral-700 mb-10">
            From notes to a finished lesson in three steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-y-3">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-500">
                  <item.icon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">
                    {item.step}
                  </span>
                </div>
                <p className="font-bold text-neutral-700">{item.title}</p>
                <p className="text-sm text-neutral-500 max-w-[240px]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subject showcase */}
      <section className="w-full py-16 px-4">
        <div className="max-w-[988px] mx-auto">
          <div className="flex flex-col items-center text-center gap-y-2 mb-10">
            <h2 className="text-2xl font-bold text-neutral-700">Start with a real subject</h2>
            <p className="text-neutral-500 max-w-[480px]">
              Every course ships with real questions out of the box — teachers can add their own on top with AI.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SUBJECTS.map((subject) => (
              <div key={subject.title} className="border-2 border-b-4 rounded-xl p-4 flex flex-col items-center text-center gap-y-3">
                <Image src={subject.imageSrc} alt={subject.title} height={48} width={48} className="rounded-lg" />
                <p className="font-bold text-neutral-700 text-sm">{subject.title}</p>
                <p className="text-xs text-neutral-500">{subject.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full bg-neutral-50 py-16 px-4">
        <div className="max-w-[640px] mx-auto">
          <h2 className="text-center text-2xl font-bold text-neutral-700 mb-8">
            Questions, answered
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left font-bold text-neutral-700">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-500">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-sky-500 py-14 px-4">
        <div className="max-w-[640px] mx-auto flex flex-col items-center text-center gap-y-5">
          <GraduationCap className="h-10 w-10 text-white" />
          <h2 className="text-2xl font-bold text-white">Ready to make your next lesson stick?</h2>
          <p className="text-sky-50">Free to start. No credit card required.</p>
          <ClerkLoaded>
            <SignedOut>
              <SignUpButton mode="modal" afterSignInUrl="/home" afterSignUpUrl="/home">
                <Button size="lg" variant="secondaryOutline" className="bg-white">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button size="lg" variant="secondaryOutline" className="bg-white" asChild>
                <Link href="/home">Continue Learning</Link>
              </Button>
            </SignedIn>
          </ClerkLoaded>
        </div>
      </section>
    </div>
  );
}
