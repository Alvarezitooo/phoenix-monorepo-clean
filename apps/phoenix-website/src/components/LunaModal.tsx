import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LunaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LunaModal({ isOpen, onClose }: LunaModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const endpoint = import.meta.env.VITE_LUNA_LEAD_ENDPOINT;
      
      if (!endpoint) {
        // Fallback local - pas d'API configurée
        console.warn("VITE_LUNA_LEAD_ENDPOINT not configured, simulating success");
        setStatus("success");
        setMessage("Merci ! Vous serez notifié dès que la bêta sera ouverte.");
        setTimeout(() => {
          onClose();
          setStatus("idle");
          setEmail("");
          setMessage("");
        }, 2000);
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "luna_modal"
        }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Merci ! Vous serez notifié dès que la bêta sera ouverte.");
        setTimeout(() => {
          onClose();
          setStatus("idle");
          setEmail("");
          setMessage("");
        }, 2000);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer.");
      console.error("Luna lead capture error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Header avec Luna */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-8 py-8 text-center text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-4 text-6xl"
                >
                  🌙
                </motion.div>
                <h2 className="mb-2 text-2xl font-bold">
                  Salut, moi c'est Luna
                </h2>
                <p className="text-indigo-100">
                  Votre guide IA pour la reconversion professionnelle
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="mb-6 text-gray-700">
                  <p className="mb-3">
                    C'est ici que notre conversation commencera. Mon rôle est de vous aider à transformer le chaos de la
                    reconversion en un récit clair et puissant.
                  </p>
                  <p className="mb-4">
                    Le processus d'inscription pour la bêta n'est pas encore ouvert, mais il le sera très prochainement.
                    Laissez votre email si vous souhaitez être le premier informé.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-3">
                  <label htmlFor="luna-email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="luna-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="rounded-2xl bg-black px-4 py-2 text-white shadow hover:shadow-md disabled:opacity-60"
                    >
                      {status === "sending" ? "Envoi…" : "Me prévenir"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Fermer
                    </button>
                  </div>
                  {message && (
                    <div
                      role="status"
                      className={`text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}
                    >
                      {message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}