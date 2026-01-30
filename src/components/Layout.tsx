import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Mail, LogIn, LogOut, MoonStar, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginModal from '@/components/LoginModal';
import { toast } from 'sonner';

const Layout: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const credentials = localStorage.getItem('awsCredentials');
    setIsLoggedIn(Boolean(credentials));
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('awsCredentials');
    setIsLoggedIn(false);
    toast.success('Successfully logged out');
    navigate('/login');
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Email Templates', href: '/templates' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="flex">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Amazon SES Manager</span>
              <Mail className="h-6 w-6 text-primary" />
            </Link>
          </div>
          <div className="flex gap-4 sm:gap-x-8 lg:gap-x-12">
            {navigation.map((item) => (
              <Link
                to={item.href}
                className="text-sm/6 font-semibold"
                key={item.name}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <MoonStar className="h-4 w-4" />
                )}
              </Button>
              {isLoggedIn ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => navigate('/login')}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 container py-6">
        <Outlet />
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
      />

      <footer className="py-4 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          Amazon SES Manager &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
