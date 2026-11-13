import BirthdaySection from '../../components/BirthdaySection';

export default function BirthdaysPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-gold">Birthdays 🎂</h1>
        <p className="mt-1 text-zinc-300">
          Countdown, confetti celebration, wishes aur birthday photo collection.
          Dates site par add ki jati hain — koi date pehle se nahi bhari gayi.
        </p>
      </header>
      <BirthdaySection />
    </div>
  );
}
