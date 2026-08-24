import { motion } from 'framer-motion';
import { useTabsStore } from '@/store/useTabsStore';

export const Home = () => {
  const { addTab } = useTabsStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('input[type=\"text\"]') as HTMLInputElement;
    const query = input.value.trim();
    if (query) {
      const url = /^https?:\/\//i.test(query) ? query : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      addTab(url, 'Search results');
      input.value = '';
    }
  };

  const quickLinks = [
    { name: 'Docs', url: 'https://docs.untoz.com', icon: '📓', bg: 'bg-blue-500/20' },
    { name: 'Store', url: 'https://store.untoz.com', icon: '🛒', bg: 'bg-green-500/20' },
    { name: 'Community', url: 'https://community.untoz.com', icon: '👥', bg: 'bg-purple-500/20' },
    { name: 'Support', url: 'https://support.untoz.com', icon: '🎧', bg: 'bg-red-500/20' },
  ];

  const recentSites = [
    { title: 'Unoz Blog', url: 'https://blog.untoz.com', favicon: '📝' },
    { title: 'GitHub', url: 'https://github.com', favicon: '🐱' },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com', favicon: '💥' },
    { title: 'YouTube', url: 'https://youtube.com', favicon: '▶️' },
  ];

  const bookmarks = [
    { title: 'Unoz Dashboard', url: 'https://dashboard.untoz.com', favicon: '📊' },
    { title: 'Unoz AI Studio', url: 'https://studio.untoz.com', favicon: '🤖' },
    { title: 'Unoz Marketplace', url: 'https://marketplace.untoz.com', favicon: '🛍️' },
  ];

  const continueReading = [
    { title: 'Introduction to React', url: 'https://dev.to/react/intro', favicon: '⚛️' },
    { title: 'Tailwind CSS Tips', url: 'https://tailwindcss.com/blog', favicon: '💨' },
    { title: 'Framer Motion Animation', url: 'https://framer.com/motion/', favicon: '🎬' },
  ];

  const futureServices = [
    { name: 'Unoz Cloud', description: 'Cloud storage and sync', icon: '☁️' },
    { name: 'Unoz AI Assistant', description: 'AI-powered browsing helper', icon: '🤖' },
    { name: 'Unoz Wallet', description: 'Secure crypto wallet', icon: '💰' },
    { name: 'Unoz Games', description: 'Browser-based gaming platform', icon: '🎮' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-center mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              Untoz Browser
            </span>
          </h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search or enter website..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus-ring-blue-500 focus:border-transparent backdrop-blur-sm"
                autoComplete="off"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">

          {/* Quick Access Cards */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-left">Acesso rápido</h2>
            <div className="gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((link) => (
                <motion.div
                  key={link.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`
                    flex flex-col items-center p-6 rounded-xl
                    ${link.bg} hover:bg-gray-700/30 transition-colors
                    cursor-pointer
                  `}
                  onClick={() => {
                    addTab(link.url, link.name);
                  }}
                >
                  <div className="text-3xl mb-2">{link.icon}</div>
                  <p className="text-lg font-medium text-center">{link.name}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Recent Sites */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Sites recentes</h2>
              <a href="#" className="text-sm text-blue-400 hover:underline">
                Ver tudo
              </a>
            </div>
            <div className="space-y-3">
              {recentSites.map((site) => (
                <motion.div
                  key={site.url}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    addTab(site.url, site.title);
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-lg bg-gray-700/50 rounded-full">
                    {site.favicon}
                  </div>
                  <div className="flex-1 ml-4">
                    <h3 className="font-medium">{site.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{site.url}</p>
                  </div>
                  <span className="ml-4 text-gray-500">•</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Bookmarks */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Marcadores</h2>
              <a href="#" className="text-sm text-blue-400 hover:underline">
                Editar
              </a>
            </div>
            <div className="space-y-3">
              {bookmarks.map((bm) => (
                <motion.div
                  key={bm.url}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    addTab(bm.url, bm.title);
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-lg bg-gray-700/50 rounded-full">
                    {bm.favicon}
                  </div>
                  <div className="flex-1 ml-4">
                    <h3 className="font-medium">{bm.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{bm.url}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Continue Reading / Continue onde parou */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Continúe onde parou</h2>
              <a href="#" className="text-sm text-blue-400 hover:underline">
                Ver histórico
              </a>
            </div>
            <div className="space-y-3">
              {continueReading.map((item) => (
                <motion.div
                  key={item.url}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    addTab(item.url, item.title);
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-lg bg-gray-700/50 rounded-full">
                    {item.favicon}
                  </div>
                  <div className="flex-1 ml-4">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{item.url}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Future Untoz Services */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Próximos serviços UNTOZ</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {futureServices.map((svc) => (
                <motion.div
                  key={svc.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-colors cursor-default"
                >
                  <div className="text-3xl mb-3">{svc.icon}</div>
                  <h3 className="font-semibold mb-2">{svc.name}</h3>
                  <p className="text-sm text-gray-400">{svc.description}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Untoz Browser. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};