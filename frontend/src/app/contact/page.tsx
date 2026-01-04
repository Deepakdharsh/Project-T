'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ArrowRight, ExternalLink } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { api, getApiConfig } from '@/lib/api';

export default function ContactPage() {
  const { baseUrl } = getApiConfig();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email';
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) newErrors.phone = 'Enter a valid phone number';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.contact(baseUrl, {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setErrors((p) => ({ ...p, message: err?.message || 'Failed to send message. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">Contact</h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
            Have a question or want to book a private event? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 p-6">
              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6">Info</h2>

              <div className="space-y-5 text-sm">
                <div className="flex gap-3">
                  <MapPin className="text-zinc-500 mt-0.5" size={18} />
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Address</div>
                    <div className="text-zinc-200">
                      Savannestraat 51<br />1448 WB Purmerend<br />Netherlands
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="text-zinc-500 mt-0.5" size={18} />
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Phone</div>
                    <a className="text-zinc-200 hover:text-white" href="tel:+312999123456">
                      +31 299 912 3456
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail className="text-zinc-500 mt-0.5" size={18} />
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</div>
                    <a className="text-zinc-200 hover:text-white" href="mailto:contact@4cantera.com">
                      contact@4cantera.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock className="text-zinc-500 mt-0.5" size={18} />
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hours</div>
                    <div className="text-zinc-200">Mon–Fri 09:00–22:00</div>
                    <div className="text-zinc-200">Sat–Sun 08:00–23:00</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Location</h2>
                <a
                  href="https://www.google.com/maps?q=Savannestraat+51,+1448+WB+Purmerend,+Netherlands"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  Open in Maps <ExternalLink size={14} />
                </a>
              </div>

              <div className="relative w-full overflow-hidden border border-white/10 bg-black" style={{ paddingTop: '56.25%' }}>
                <iframe
                  title="4Cantera location map"
                  src="https://www.google.com/maps?q=Savannestraat+51,+1448+WB+Purmerend,+Netherlands&output=embed"
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <p className="text-zinc-500 text-xs mt-4 leading-relaxed">
                Tip: for the fastest route, open the map and use directions.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 border border-white/10 p-6 md:p-10">
              <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-8">Send a message</h2>

              {submitted ? (
                <div className="bg-green-950/30 border border-green-900 p-6 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send size={18} className="text-white" />
                  </div>
                  <div className="text-green-400 font-bold uppercase tracking-widest text-sm">Message sent</div>
                  <div className="text-zinc-400 text-sm mt-1">We&apos;ll get back to you soon.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Name *
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full bg-black border p-4 text-white outline-none ${
                          errors.name ? 'border-red-500' : 'border-zinc-700 focus:border-white'
                        }`}
                        placeholder="Your name"
                      />
                      {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Email *
                      </label>
                      <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full bg-black border p-4 text-white outline-none ${
                          errors.email ? 'border-red-500' : 'border-zinc-700 focus:border-white'
                        }`}
                        placeholder="you@example.com"
                      />
                      {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Phone</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full bg-black border p-4 text-white outline-none ${
                        errors.phone ? 'border-red-500' : 'border-zinc-700 focus:border-white'
                      }`}
                      placeholder="+31 6 1234 5678"
                    />
                    {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full bg-black border p-4 text-white outline-none ${
                        errors.subject ? 'border-red-500' : 'border-zinc-700 focus:border-white'
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="booking">Booking</option>
                      <option value="private">Private Event</option>
                      <option value="programs">Programs</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.subject && <div className="text-red-500 text-xs mt-1">{errors.subject}</div>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className={`w-full bg-black border p-4 text-white outline-none resize-none ${
                        errors.message ? 'border-red-500' : 'border-zinc-700 focus:border-white'
                      }`}
                      placeholder="Tell us how we can help..."
                    />
                    {errors.message && <div className="text-red-500 text-xs mt-1">{errors.message}</div>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 px-6 font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 ${
                      submitting ? 'bg-zinc-300 text-black opacity-80 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    {submitting ? 'Sending…' : 'Send'} <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


