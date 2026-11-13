import { motion } from "framer-motion";

export function LoadingMessage() {
  return (
    <div className="px-4 py-3 rounded-lg bg-muted">
      <div className="flex items-center gap-2">
        <motion.div
          className="w-2 h-2 bg-primary/50 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.div
          className="w-2 h-2 bg-primary/50 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, delay: 0.2, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.div
          className="w-2 h-2 bg-primary/50 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, delay: 0.4, repeat: Infinity, repeatType: "loop" }}
        />
      </div>
    </div>
  );
}
