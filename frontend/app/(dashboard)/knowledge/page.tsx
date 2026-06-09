"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, X, Search, Loader2, AlertCircle, Inbox, Trash2, Edit3 } from "lucide-react";
import { useKnowledgeArticles, useKnowledgeCategories, useKnowledgeArticle, useCreateKnowledgeArticle, useUpdateKnowledgeArticle, useDeleteKnowledgeArticle } from "@/lib/api-hooks";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories } = useKnowledgeCategories();
  const { data: articles, isLoading, error } = useKnowledgeArticles({ category: categoryFilter || undefined, q: search || undefined });
  const { data: selectedArticle } = useKnowledgeArticle(selectedId ?? "");
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();

  const [form, setForm] = useState({ title: "", title_bn: "", content: "", content_bn: "", category: "", tags: "", is_public: false });

  const resetForm = () => setForm({ title: "", title_bn: "", content: "", content_bn: "", category: "", tags: "", is_public: false });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    await createArticle.mutateAsync({
      title: form.title, content: form.content,
      title_bn: form.title_bn || null, content_bn: form.content_bn || null,
      category: form.category || null, tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
      is_public: form.is_public,
    });
    resetForm();
    setShowCreate(false);
  };

  const handleEdit = async () => {
    if (!editingId || !form.title.trim() || !form.content.trim()) return;
    await updateArticle.mutateAsync({
      id: editingId,
      data: {
        title: form.title, content: form.content,
        title_bn: form.title_bn || null, content_bn: form.content_bn || null,
        category: form.category || null, tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
        is_public: form.is_public,
      },
    });
    resetForm();
    setEditingId(null);
  };

  const startEdit = useCallback((article: any) => {
    setForm({
      title: article.title, title_bn: article.title_bn ?? "",
      content: article.content, content_bn: article.content_bn ?? "",
      category: article.category ?? "", tags: Array.isArray(article.tags) ? article.tags.join(", ") : "",
      is_public: article.is_public,
    });
    setEditingId(article.id);
    setSelectedId(article.id);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    await deleteArticle.mutateAsync(id);
    if (selectedId === id) setSelectedId(null);
  };

  const selectedArticleData = selectedArticle ?? articles?.find((a) => a.id === selectedId);

  return (
    <motion.div
      className="max-w-6xl mx-auto flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-400 mt-1">Medical FAQ, protocols, and reference articles for AI agents</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Article
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="">All Categories</option>
          {(categories ?? []).map((c: string) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Article List */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
              <p className="text-sm text-slate-400">Failed to load articles</p>
            </div>
          )}
          {!isLoading && !error && (!articles || articles.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-sm text-slate-400 font-medium">No articles</p>
              <p className="text-xs text-slate-500 mt-1">Create an article to start building your knowledge base</p>
            </div>
          )}
          {!isLoading && !error && articles && articles.length > 0 && (
            <motion.div
              className="flex flex-col gap-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            >
              {articles.map((a) => (
                <motion.button
                  key={a.id}
                  variants={itemVariants}
                  onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
                  className={`text-left bg-[#0a1120] border rounded-2xl p-4 transition-all hover:border-slate-700/60 ${selectedId === a.id ? "border-emerald-500/30" : "border-slate-800/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{a.title_bn || a.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {a.category && <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{a.category}</span>}
                        {a.tags && (a.tags as string[]).slice(0, 2).map((t) => (
                          <span key={t} className="text-[9px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                        {a.is_public && <span className="text-[9px] text-blue-400">Public</span>}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Detail / Editor */}
        <AnimatePresence>
          {(selectedArticleData || editingId) && (
            <motion.div
              key={editingId || selectedArticleData?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-[420px] shrink-0 bg-[#0a1120] border border-slate-800/60 rounded-2xl flex flex-col max-h-[calc(100vh-12rem)]"
            >
              {editingId ? (
                <>
                  <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Edit Article</h3>
                    <button onClick={() => { setEditingId(null); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Title</label>
                      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Title (BN)</label>
                      <input value={form.title_bn} onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Content</label>
                      <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6}
                        className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-y" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Content (BN)</label>
                      <textarea value={form.content_bn} onChange={(e) => setForm({ ...form, content_bn: e.target.value })} rows={3}
                        className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-y" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Category</label>
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer">
                          <option value="">None</option>
                          {(categories ?? []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-700 bg-[#070b13] text-emerald-500 focus:ring-emerald-500/30" />
                          <span className="text-xs text-slate-300">Public</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tags (comma separated)</label>
                      <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="fever, covid, treatment"
                        className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-800/60 flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditingId(null); resetForm(); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors">Cancel</button>
                    <button onClick={handleEdit} disabled={!form.title.trim() || !form.content.trim() || updateArticle.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-1">
                      {updateArticle.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                </>
              ) : selectedArticleData ? (
                <>
                  <div className="p-4 border-b border-slate-800/60 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white">{selectedArticleData.title_bn || selectedArticleData.title}</h3>
                      {selectedArticleData.category && (
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">{selectedArticleData.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => startEdit({ ...selectedArticleData, title_bn: selectedArticleData.title_bn ?? "", content_bn: selectedArticleData.content_bn ?? "", tags: Array.isArray(selectedArticleData.tags) ? selectedArticleData.tags.join(", ") : "" })}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(selectedArticleData.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedArticleData.content}</div>
                    {selectedArticleData.content_bn && (
                      <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap border-t border-slate-800/60 pt-4">{selectedArticleData.content_bn}</div>
                    )}
                    {selectedArticleData.tags && (selectedArticleData.tags as string[]).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap border-t border-slate-800/60 pt-4">
                        {(selectedArticleData.tags as string[]).map((t) => (
                          <span key={t} className="text-[9px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-white">New Article</h2>
                <button onClick={() => { setShowCreate(false); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Article title"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Title (বাংলা)</label>
                  <input value={form.title_bn} onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
                    placeholder="নিবন্ধের শিরোনাম"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Content *</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5}
                    placeholder="Article content..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Content (বাংলা)</label>
                  <textarea value={form.content_bn} onChange={(e) => setForm({ ...form, content_bn: e.target.value })} rows={3}
                    placeholder="নিবন্ধের বিষয়বস্তু..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-300 focus:outline-none cursor-pointer">
                      <option value="">General</option>
                      <option value="faq">FAQ</option>
                      <option value="protocol">Protocol</option>
                      <option value="medication">Medication</option>
                      <option value="symptoms">Symptoms</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="emergency">Emergency</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 bg-[#070b13] text-emerald-500 focus:ring-emerald-500/30" />
                      <span className="text-xs text-slate-300">Public</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="e.g. fever, covid, treatment"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => { setShowCreate(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={!form.title.trim() || !form.content.trim() || createArticle.isPending}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-2">
                  {createArticle.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create Article
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
