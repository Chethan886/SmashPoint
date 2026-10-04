'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Member } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import { compressImageToDataUrl } from '@/lib/imageUtils';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  ArrowRight,
  Camera,
  Upload,
  Image as ImageIcon,
  BarChart2,
  Crop as CropIcon
} from 'lucide-react';
import Link from 'next/link';
import ToastContainer, { ToastMessage } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import ImageCropperModal from '@/components/ImageCropperModal';

const AVATAR_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#14b8a6', // teal
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Member Modal / Form State
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Member State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editNickname, setEditNickname] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Interactive Avatar Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [isCroppingForEdit, setIsCroppingForEdit] = useState<boolean>(false);

  // Toast & Modal States
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deletingMember, setDeletingMember] = useState<{ id: string; name: string } | null>(null);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await dataService.getMembers();
      setMembers(data);
    } catch (err: any) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please select a valid image file (JPG, PNG, WebP).',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result as string);
      setIsCroppingForEdit(isEdit);
      setIsCropperOpen(true);
    };
    reader.onerror = () => {
      showToast({
        type: 'error',
        title: 'Error Reading Image',
        message: 'Could not open the selected picture.',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (isCroppingForEdit) {
      setEditAvatarUrl(croppedDataUrl);
    } else {
      setAvatarUrl(croppedDataUrl);
    }
    setIsCropperOpen(false);
    setCropperImageSrc(null);
    showToast({
      type: 'success',
      title: 'Photo Cropped',
      message: 'Avatar repositioned and attached!',
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Player name is required.');
      return;
    }

    try {
      setErrorMsg(null);
      await dataService.addMember(name.trim(), nickname.trim() || undefined, avatarColor, avatarUrl);
      showToast({
        type: 'success',
        title: 'Player Added',
        message: `${name.trim()} has been added to the squad!`,
      });
      setName('');
      setNickname('');
      setAvatarUrl(null);
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setIsAdding(false);
      await loadMembers();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add member');
      showToast({
        type: 'error',
        title: 'Add Failed',
        message: err?.message || 'Failed to add member',
      });
    }
  };

  const handleStartEdit = (m: Member) => {
    setEditingMember(m);
    setEditName(m.name);
    setEditNickname(m.nickname || '');
    setEditColor(m.avatar_color || AVATAR_COLORS[0]);
    setEditAvatarUrl(m.avatar_url || null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    try {
      await dataService.updateMember(editingMember.id, {
        name: editName.trim(),
        nickname: editNickname.trim() || null,
        avatar_color: editColor,
        avatar_url: editAvatarUrl,
      });
      showToast({
        type: 'success',
        title: 'Player Updated',
        message: `${editName.trim()}'s profile was updated.`,
      });
      setEditingMember(null);
      await loadMembers();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update member.',
      });
    }
  };

  const handleDeleteMember = (id: string, memberName: string) => {
    setDeletingMember({ id, name: memberName });
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    try {
      await dataService.deleteMember(deletingMember.id);
      showToast({
        type: 'info',
        title: 'Player Removed',
        message: `${deletingMember.name} has been removed from the roster.`,
      });
      setDeletingMember(null);
      await loadMembers();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Failed to delete member.',
      });
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.nickname && m.nickname.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            Squad Roster
          </h1>
          <p className="text-xs text-slate-400">
            {members.length} players registered
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Player</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by player or nickname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400">
          Total Players: <span className="text-emerald-400 font-bold">{members.length}</span>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading player roster...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No players found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {searchTerm ? 'No members match your search criteria.' : 'Add your first badminton player to get started!'}
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
          >
            Add Player
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="group relative rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 p-5 transition-all duration-300 shadow-lg hover:shadow-emerald-950/20 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/stats?player=${member.id}`}
                  className="flex items-center gap-3.5 group/info flex-1 min-w-0"
                  title="View player statistics"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover shadow-md ring-1 ring-white/10 group-hover/info:ring-emerald-400 transition-all"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md group-hover/info:scale-105 transition-transform"
                      style={{ backgroundColor: member.avatar_color || '#10b981' }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-white text-base group-hover/info:text-emerald-300 transition-colors truncate">
                      {member.name}
                    </h3>
                    {member.nickname ? (
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate max-w-full">
                        &quot;{member.nickname}&quot;
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No nickname set</span>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                  <Link
                    href={`/stats?player=${member.id}`}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="View deep player stats"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleStartEdit(member)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit player"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsAdding(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add New Player</h3>
                <p className="text-xs text-slate-400">Add player to the roster</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center gap-3.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/50"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {name.trim() ? name.trim().charAt(0).toUpperCase() : <Camera className="w-6 h-6 opacity-60" />}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <input
                      ref={addFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, false)}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>
                      {avatarUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCropperImageSrc(avatarUrl);
                              setIsCroppingForEdit(false);
                              setIsCropperOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-colors border border-slate-700 flex items-center gap-1"
                            title="Crop and reposition current photo"
                          >
                            <CropIcon className="w-3.5 h-3.5" />
                            <span>Adjust</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl(null)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors border border-rose-800/40"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Supports JPG, PNG, WebP or camera shot.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Player Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chethan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nickname / Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smash Master"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-8 h-8 rounded-xl transition-all ${
                        avatarColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all"
                >
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Edit Player</h3>
                <p className="text-xs text-slate-400">Update player details</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Profile Picture
                </label>
                <div className="flex items-center gap-3.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="relative shrink-0">
                    {editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/50"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner"
                        style={{ backgroundColor: editColor }}
                      >
                        {editName.trim() ? editName.trim().charAt(0).toUpperCase() : <Camera className="w-6 h-6 opacity-60" />}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, true)}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{editAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>
                      {editAvatarUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setCropperImageSrc(editAvatarUrl);
                              setIsCroppingForEdit(true);
                              setIsCropperOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-colors border border-slate-700 flex items-center gap-1"
                            title="Crop and reposition current photo"
                          >
                            <CropIcon className="w-3.5 h-3.5" />
                            <span>Adjust</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditAvatarUrl(null)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors border border-rose-800/40"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Upload from phone or computer gallery.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Player Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nickname / Title
                </label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-8 h-8 rounded-xl transition-all ${
                        editColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Confirmation Modal: Remove Squad Member */}
      <ConfirmModal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Member from Roster?"
        description={`Are you sure you want to remove ${deletingMember?.name || 'this player'} from the active squad? Their past match history will be preserved.`}
        confirmLabel="Remove Player"
        cancelLabel="Keep Player"
        variant="danger"
        iconType="danger"
      />

      {/* Interactive Avatar Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropperImageSrc}
        onClose={() => {
          setIsCropperOpen(false);
          setCropperImageSrc(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
