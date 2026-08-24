import { motion } from 'framer-motion';

interface TabProps {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  active: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export const Tab = ({ id, url, title, favicon, active, onSelect, onClose }: TabProps) => {
  return (
    <motion.div
      key={id}
      className={`
        flex items-center space-x-1.5 px-2 py-1 rounded-xl
        transition-all duration-200
        select-none cursor-pointer
        ${active
          ? 'bg-primary/20 text-primary border-border/20'
          : 'hover:bg-background/50 hover:border-border/10 text-foreground/60 hover:text-foreground/80'}
      `}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: active ? 1 : 0.97, opacity: active ? 1 : 0.8 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
    >
      {/* Favicon */}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        {favicon ? (
          <img
            src={favicon}
            alt="favicon"
            className="h-4 w-4 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`;
            }}
          />
        ) : (
          <div className="w-4 h-4 flex items-center justify-center bg-primary/20 rounded-md text-primary text-xs font-medium">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Tab title */}
      <span className="text-xs font-medium truncate max-w-[100px]">
        {title}
      </span>

      {/* Close button - only visible on hover or active */}
      {active || (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
          className={`
            p-0.5 rounded-full hover:bg-accent/20 hover:backdrop-brightness-105
            transition-all duration-100
            flex items-center justify-center
            text-xs text-foreground/40 hover:text-foreground/60
            hidden sm:flex
          `}
          aria-label="Fechar aba"
        >
          ×
        </motion.button>
      )}
    </motion.div>
  );
};