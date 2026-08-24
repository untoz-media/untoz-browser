import { motion } from 'framer-motion';
import { Tab } from './Tab';
import { useTabsStore } from '@/store/useTabsStore';

interface TabsProps {
  /** Array of tab objects */
  tabs: {
    id: string;
    url: string;
    title: string;
    favicon?: string;
  }[];
  /** ID of the currently active tab */
  activeTabId: string | null;
}

/**
 * Tab strip showing list of tabs - redesigned for premium, Arc-like appearance
 */
export const Tabs = ({ tabs, activeTabId }: TabsProps) => {
  const { addTab, removeTab, setActiveTab } = useTabsStore();

  const handleNewTab = () => {
    // Add a default tab (you can change the URL)
    addTab('https://www.untoz.com', 'Nova Aba');
  };

  return (
    <div className={`
      flex items-center space-x-1 px-2 py-1.5 overflow-x-auto whitespace-nowrap
      bg-background/80 backdrop-blur-lg border-b border-border/10
      transition-all duration-300
    `}>
      {/* Tab list */}
      <motion.div
        className="flex space-x-1"
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            url={tab.url}
            title={tab.title}
            favicon={tab.favicon}
            active={tab.id === activeTabId}
            onSelect={setActiveTab}
            onClose={removeTab}
          />
        ))}
      </motion.div>

      {/* New Tab button */}
      <motion.button
        onClick={handleNewTab}
        aria-label="Nova aba"
        className={`
          p-1.5 rounded-xl hover:bg-accent/5 hover:backdrop-brightness-105
          transition-all duration-200
          flex items-center justify-center
          text-foreground/60 hover:text-foreground/90
          border border-border/20
        `}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        +
      </motion.button>
    </div>
  );
};