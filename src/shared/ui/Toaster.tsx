import { Toaster as SonnerToaster, ToasterProps } from 'sonner';

export const Toaster = (props: ToasterProps) => (
  <SonnerToaster richColors closeButton duration={4000} {...props} />
);
