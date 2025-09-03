import LunaChatWidget from "../components/LunaChatWidget";

export default function AubePage() {
  return (
    <div className="w-full">
      <header className="text-center mb-8">
        <h2 className="text-3xl font-bold text-purple-300">Phoenix Aube</h2>
        <p className="text-lg text-gray-400">Discutez avec Luna pour découvrir votre voie.</p>
      </header>
      <LunaChatWidget />
    </div>
  );
}