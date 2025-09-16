import { PhoenixNavigation } from "../shared";
import EnergyPacks from "../components/EnergyPacks";

export default function EnergyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <PhoenixNavigation />
      
      <div className="pt-24 pb-16">
        <EnergyPacks />
      </div>
    </div>
  );
}