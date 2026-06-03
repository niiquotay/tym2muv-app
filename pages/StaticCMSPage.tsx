import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStaticPageBySlug } from '../services/supabaseService';
import { StaticPage } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { ArrowLeft, BookOpen, Clock, Globe } from 'lucide-react';

const StaticCMSPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      try {
        if (slug) {
          const res = await getStaticPageBySlug(slug);
          setPage(res);
        }
      } catch (e) {
        console.error('Error loading static page:', e);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          <p className="text-sm font-medium text-slate-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-md text-center">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Document Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            The page you are looking for has either been moved, draft restricted, or is currently unavailable in this region.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all text-sm"
          >
            <ArrowLeft size={16} /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-3 text-xs md:text-sm text-slate-500 font-medium">
          <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">{page.title}</span>
        </div>

        {/* Paper Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 md:p-16">
          {/* Header Metadata */}
          <div className="border-b border-slate-100 pb-8 mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
              {page.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono font-medium">
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>Published: {new Date(page.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>Reference ID: {page.id}</span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] border border-emerald-100">
                ACTIVE GATEWAY
              </span>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="prose max-w-none prose-slate">
            <MarkdownRenderer content={page.content} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticCMSPage;
