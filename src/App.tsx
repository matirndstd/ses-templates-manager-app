import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Layout from '@/components/Layout';
import EmailTemplateForm from '@/components/email-template/EmailTemplateForm';
import EmailTemplateList from '@/components/email-template/EmailTemplateList';
import ListContactList from '@/components/contact-list/ListContactList';
import ContactListForm from '@/components/contact-list/ContactListForm';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/templates" element={<EmailTemplateList />} />
            <Route path="/templates/new" element={<EmailTemplateForm />} />
            <Route path="/templates/edit" element={<EmailTemplateForm />} />
            <Route path="/contact-lists" element={<ListContactList />} />
            <Route path="/contact-lists/new" element={<ContactListForm />} />
            <Route path="/contact-lists/:name" element={<ContactListForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
