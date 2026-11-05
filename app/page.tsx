"use client";

import { type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadEntries() {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setEntries(data ?? []);
      }

      setLoading(false);
    }

    loadEntries();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("entries")
      .insert({ title: cleanTitle, content: cleanContent })
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else if (data) {
      setEntries([data, ...entries]);
      setTitle("");
      setContent("");
    }

    setSaving(false);
  }

  function startEditing(entry: Entry) {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  }

  async function handleUpdate(id: string) {
    const cleanTitle = editTitle.trim();
    const cleanContent = editContent.trim();

    if (!cleanTitle || !cleanContent) {
      return;
    }

    setUpdating(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("entries")
      .update({ title: cleanTitle, content: cleanContent })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else if (data) {
      setEntries(entries.map((entry) => (entry.id === id ? data : entry)));
      cancelEditing();
    }

    setUpdating(false);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this entry?");

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-300">
          Public shared vault
        </p>

        <h1 className="text-5xl font-bold">KaizenVault</h1>

        <p className="mt-4 text-lg text-slate-300">
          Save useful text in one shared place.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6"
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Entry title"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400"
          />

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write something useful..."
            rows={4}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add entry"}
          </button>
        </form>

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-950 p-4 text-red-200">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-slate-400">Loading entries...</p>
          ) : (
            entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-6"
              >
                {editingId === entry.id ? (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                    />

                    <textarea
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdate(entry.id)}
                        disabled={updating}
                        className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
                      >
                        {updating ? "Saving..." : "Save changes"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={updating}
                        className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">{entry.title}</h2>

                    <p className="mt-2 whitespace-pre-wrap text-slate-300">
                      {entry.content}
                    </p>

                    <div className="mt-4 flex gap-4">
                      <button
                        type="button"
                        onClick={() => startEditing(entry)}
                        className="text-sm font-semibold text-cyan-300"
                      >
                        Edit entry
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="text-sm font-semibold text-red-300"
                      >
                        Delete entry
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}