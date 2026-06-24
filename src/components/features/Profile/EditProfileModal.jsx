import React, { useState } from "react";
import { X, ChevronDown, Search, Image as ImageIcon, Crop } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
export const NIGERIAN_UNIVERSITIES = [
  "Abubakar Tafawa Balewa University, Bauchi (ATBU)", "Ahmadu Bello University, Zaria (ABU)", "Federal University Dutse, Jigawa (FUD)",
  "Federal University Dutsin-Ma, Katsina (FUDMA)", "Federal University Gashua, Yobe", "Federal University Gusau, Zamfara",
  "Federal University Kashere, Gombe (FUKASHERE)", "Federal University Lafia, Nasarawa", "Federal University Lokoja, Kogi (FULOKOJA)",
  "Federal University Ndufu-Alike, Ebonyi (FUNAI)", "Federal University Otuoke, Bayelsa (FUO)", "Federal University Oye-Ekiti (FUOYE)",
  "Federal University Wukari, Taraba (FUW)", "Federal University, Birnin Kebbi (FUBK)", "Federal University, Gombe (FUGombe)",
  "Federal University, Ikole, Ekiti (FUIKE)", "Federal University of Agriculture, Abeokuta (FUNAAB)", "Federal University of Agriculture, Makurdi (FUAM)",
  "Federal University of Agriculture, Zuru, Kebbi (FUAZ)", "Federal University of Health Sciences, Azare, Bauchi", "Federal University of Health Sciences, Ila-Orangun, Osun",
  "Federal University of Health Sciences, Otukpo, Benue", "Federal University of Petroleum Resources, Effurun (FUPRE)", "Federal University of Technology, Akure (FUTA)",
  "Federal University of Technology, Babura, Jigawa", "Federal University of Technology, Ikot Abasi, Akwa Ibom", "Federal University of Technology, Minna (FUTMinna)",
  "Federal University of Technology, Owerri (FUTO)", "Michael Okpara University of Agriculture, Umudike (MOUAU)", "Modibbo Adama University, Yola (MAU)",
  "National Open University of Nigeria, Abuja (NOUN)", "Nigerian Defence Academy, Kaduna (NDA)", "Nnamdi Azikiwe University, Awka (UNIZIK)",
  "Obafemi Awolowo University, Ile-Ife (OAU)", "University of Abuja (UNIABUJA)", "University of Benin (UNIBEN)", "University of Calabar (UNICAL)",
  "University of Ibadan (UI)", "University of Ilorin (UNILORIN)", "University of Jos (UNIJOS)", "University of Lagos (UNILAG)",
  "University of Maiduguri (UNIMAID)", "University of Nigeria, Nsukka (UNN)", "University of Port Harcourt (UNIPORT)",
  "University of Uyo (UNIUYO)", "Usmanu Danfodiyo University, Sokoto (UDUSOK)", "Abia State University, Uturu (ABSU)",
  "Adamawa State University, Mubi (ADSU)", "Adekunle Ajasin University, Akungba-Akoko (AAUA)", "Akwa Ibom State University, Ikot Akpaden (AKSU)",
  "Ambrose Alli University, Ekpoma (AAU)", "Anambra State University, Uli (ANSU)", "Bauchi State University, Gadau (BASU)",
  "Benue State University, Makurdi (BSU)", "Borno State University, Maiduguri (BOSU)", "Chukwuemeka Odumegwu Ojukwu University, Uli (COOU)",
  "Cross River University of Technology, Calabar (CRUTECH)", "Delta State University, Abraka (DELSU)", "Ebonyi State University, Abakaliki (EBSU)",
  "Edo State University Uzairue (EDSU)", "Ekiti State University, Ado-Ekiti (EKSU)", "Enugu State University of Science and Technology, Enugu (ESUT)",
  "Gombe State University, Tudun Wada (GSU)", "Ibrahim Badamasi Babangida University, Lapai (IBBU)", "Ignatius Ajuru University of Education, Port Harcourt (IAUE)",
  "Imo State University, Owerri (IMSU)", "Isoko Community University, Ozoro, Delta", "Kaduna State University, Kaduna (KASU)",
  "Kebbi State University of Science and Technology, Aliero (KSUSTA)", "Kogi State University, Anyigba (KSU)", "Kwara State University, Malete (KWASU)",
  "Ladoke Akintola University of Technology, Ogbomoso (LAUTECH)", "Lagos State University, Ojo (LASU)", "Niger Delta University, Wilberforce Island (NDU)",
  "Nasarawa State University, Keffi (NSUK)", "Ondo State University of Science and Technology, Okitipupa (OSUSTECH)", "Olabisi Onabanjo University, Ago-Iwoye (OOU)",
  "Osun State University, Osogbo (UNIOSUN)", "Oyo State Technical University, Ibadan (OYOTECH)", "Plateau State University, Bokkos (PLASU)",
  "Prince Abubakar Audu University, Anyigba, Kogi", "Rivers State University, Port Harcourt (RSU)", "Samuel Adegboyega University, Ogwa, Edo",
  "Sokoto State University (SSU)", "Sule Lamido University, Kafin Hausa, Jigawa (SLU)", "Tai Solarin University of Education, Ijagun (TASUED)",
  "Taraba State University, Jalingo (TSU)", "Umaru Musa Yar'adua University, Katsina (UMYU)", "University of Delta, Agbor (UNIDEL)",
  "Yobe State University, Damaturu (YSU)", "Zamfara State University, Talata Mafara", "Achievers University, Owo (AU)", "Adeleke University, Ede",
  "Afe Babalola University, Ado-Ekiti (ABUAD)", "African University of Science and Technology, Abuja (AUST)", "Al-Hikmah University, Ilorin",
  "Al-Qalam University, Katsina (AUK)", "American University of Nigeria, Yola (AUN)", "Augustine University Ilara, Lagos",
  "Babcock University, Ilishan-Remo (BU)", "Baze University, Abuja", "Bells University of Technology, Ota",
  "Benson Idahosa University, Benin City (BIU)", "Bowen University, Iwo", "Caleb University, Lagos", "Caritas University, Enugu",
  "Chrisland University, Owode, Ogun", "Christopher University, Mowe, Ogun", "Clifford University, Owerrinta, Abia",
  "Coal City University, Enugu", "Covenant University, Ota (CU)", "Crawford University, Igbesa, Ogun", "Crescent University, Abeokuta",
  "Crown Hill University, Eiyenkorin, Kwara", "David Umahi Federal University of Health Sciences, Uburu, Ebonyi", "Dominican University, Ibadan",
  "Edwin Clark University, Kiagbodo, Delta", "El-Amin University, Minna, Niger", "Elizade University, Ilara-Mokin, Ondo",
  "Evangel University, Akaeze, Ebonyi", "Fountain University, Osogbo", "Glorious Vision University, Ogwa, Edo",
  "Godfrey Okoye University, Enugu", "Gregory University, Uturu, Abia", "Hallmark University, Ijebu-Itele, Ogun",
  "Hezekiah University, Umudi, Imo", "Igbinedion University, Okada, Edo", "Joseph Ayo Babalola University, Ikeji-Arakeji (JABU)",
  "Kings University, Ode-Omu, Osun", "Kola Daisi University, Ibadan, Oyo", "Kwararafa University, Wukari, Taraba",
  "Landmark University, Omu-Aran (LMU)", "Lead City University, Ibadan", "Legacy University, Okija, Anambra",
  "Lifeforte International University, Ibadan", "Madonna University, Okija (MU)", "Mcpherson University, Seriki Sotayo, Ogun",
  "Micheal and Cecilia Ibru University, Owhrode, Delta", "Mountain Top University, Lagos", "Newgate University, Minna, Niger",
  "Nigeria-Turkish Nile University, Abuja (NTNU)", "Novena University, Ogume, Delta", "Oduduwa University, Ipetumodu, Osun",
  "Olabisi Onabanjo University (Private wing), Ogun", "Pan-Atlantic University, Lagos", "Paul University, Awka, Anambra",
  "Peaceland College of Education, Enugu", "Precious Cornerstone University, Ibadan", "Redeemer's University, Ede (RUN)",
  "Renaissance University, Enugu", "Rhema University, Obeama-Asa, Rivers", "Ritman University, Ikot Epene, Akwa Ibom",
  "Salem University, Lokoja (SU)", "Skyline University Nigeria, Kano", "Southwestern University, Oku Owa, Ogun",
  "Spiritan University, Nneochi, Abia", "St. Albert the Great University, Kwara", "Summit University, Offa, Kwara",
  "Tansian University, Umunya, Anambra", "Thomas Adewumi University, Oko, Kwara", "University of Mkar, Mkar, Benue",
  "Veritas University, Abuja", "Wellspring University, Evbuobanosa, Edo", "Wesley University, Ondo",
  "Western Delta University, Oghara, Delta", "Westland University, Iwo, Osun",
].sort();

export const FUTA_FACULTIES = [
  "SESE", "SIMME", "SLS", "SOC", "SPS", "SAAT", "SBMS", "SLIT", "SEMS", "SET"
];

export const isFUTA = (uni) => !!(uni && uni.includes("Federal University of Technology, Akure"));

// ─────────────────────────────────────────────────────────────────
// SHARED STYLES (Exported so Profile.jsx can use them)
// ─────────────────────────────────────────────────────────────────
export const accent = T => T?.isDark ? "#00D2C4" : "#0F766E";

export const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
  display: "flex", justifyContent: "center", alignItems: "center",
  background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", padding: 16
};

export const glass = (T) => ({
  background: T?.cardBg, backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)", border: `1px solid ${T?.cardBorder}`,
  boxShadow: T?.cardShadow
});

export const inputStyle = T => ({
  padding: 10, borderRadius: 10, width: "100%", boxSizing: "border-box",
  background: T?.inputBg, border: `1px solid ${T?.inputBorder}`,
  color: T?.text, outline: "none", fontSize: 13,
});

export const inputContainerStyle = T => ({
  borderRadius: 10, border: `1px solid ${T?.inputBorder}`,
  background: T?.inputBg, overflow: "hidden", display: "flex", alignItems: "center"
});

export const radioLabelStyle = (T, active) => ({
  flex: 1, padding: "9px 0", borderRadius: 10, textAlign: "center",
  fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer",
  border: `1px solid ${active ? (T?.isDark ? "#00D2C4" : "#0F766E") : T?.inputBorder}`,
  background: active ? (T?.isDark ? "rgba(0,210,196,0.12)" : "rgba(15,118,110,0.1)") : T?.inputBg,
  color: active ? (T?.isDark ? "#00D2C4" : "#0F766E") : T?.text,
  transition: "all 0.2s"
});

export const btnStyle = (T, variant = "secondary", extra = {}) => ({
  flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6,
  padding: 12, borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 13,
  transition: "all 0.2s",
  border: variant === "secondary" ? `1px solid ${T?.inputBorder}` : "none",
  background: variant === "secondary" ? "transparent" : `linear-gradient(135deg, ${accent(T)}, ${T?.isDark ? "#0077b6" : "#0ea5e9"})`,
  color: variant === "secondary" ? T?.text : "#0B0F12",
  boxShadow: variant === "primary" ? `0 4px 16px ${accent(T)}44` : "none",
  ...extra
});

export const closeBtnStyle = (T) => ({
  position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)",
  border: "none", borderRadius: "50%", padding: 6, cursor: "pointer", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center"
});

const Field = ({ label, children, T }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 11.5, color: T?.mutedMid, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// SEARCHABLE UNIVERSITY DROPDOWN
// ─────────────────────────────────────────────────────────────────
const SearchableUniDropdown = ({ T, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUnis = NIGERIAN_UNIVERSITIES.filter(uni =>
    uni.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: 10, borderRadius: 10, background: T?.isDark ? "#12181E" : "#fff",
          border: `1px solid ${T?.inputBorder}`, color: value ? T?.text : T?.muted,
          fontSize: 13, display: "flex", justifyContent: "space-between",
          alignItems: "center", cursor: "pointer", userSelect: "none"
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {value || "Select your university..."}
        </span>
        <ChevronDown size={16} color={T?.mutedMid} style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }} />
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
          background: T?.isDark ? "#12181E" : "#fff", border: `1px solid ${T?.inputBorder}`,
          borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.6)"
        }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${T?.divider}` }}>
            <div style={{ display: "flex", alignItems: "center", background: T?.isDark ? "#1A222B" : "#f1f5f9", borderRadius: 8, padding: "4px 10px", gap: 6 }}>
              <Search size={13} color={T?.mutedMid} />
              <input type="text" placeholder="Search university..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} autoFocus
                style={{ flex: 1, border: "none", background: "none", outline: "none", color: T?.text, fontSize: 13, padding: "4px 0" }} />
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filteredUnis.length > 0 ? filteredUnis.map(uni => (
              <div key={uni} onClick={() => { onChange(uni); setIsOpen(false); setSearchTerm(""); }}
                style={{
                  padding: "10px 14px", fontSize: 12.5, color: uni === value ? accent(T) : T?.text,
                  cursor: "pointer", borderBottom: `1px solid ${T?.divider}`,
                  background: uni === value ? (T?.isDark ? "rgba(0,210,196,0.07)" : "rgba(15,118,110,0.06)") : "transparent",
                  transition: "background 0.15s", fontWeight: uni === value ? 600 : 400
                }}
                onMouseOver={e => { if (uni !== value) e.currentTarget.style.background = T?.hoverBg; }}
                onMouseOut={e => { if (uni !== value) e.currentTarget.style.background = "transparent"; }}>
                {uni}
              </div>
            )) : (
              <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: T?.muted }}>
                No university found for "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// IMAGE PREVIEW / CROP MODALS (Exported for Profile.jsx)
// ─────────────────────────────────────────────────────────────────
export const ImagePreviewModal = ({ src, onClose, T }) => (
  <div style={overlayStyle}>
    <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
      <button type="button" onClick={onClose} style={closeBtnStyle(T)}><X size={20} color="#fff" /></button>
      <img src={src} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
    </div>
  </div>
);

export const CropSimulateModal = ({ src, onSave, onClose, T }) => {
  return (
    <div style={overlayStyle}>
      <div style={{ ...glass(T), width: 320, padding: 20, borderRadius: 16, textAlign: "center" }}>
        <h4 style={{ margin: "0 0 16px 0", color: T?.text }}>Adjust & Crop Image</h4>
        <div style={{ width: "100%", height: 200, background: "#000", position: "relative", borderRadius: 8, overflow: "hidden" }}>
          <img src={src} alt="Crop" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
          <div style={{ position: "absolute", top: "20%", left: "20%", right: "20%", bottom: "20%", border: "2px dashed #fff", boxShadow: "0 0 0 999px rgba(0,0,0,0.5)" }} />
        </div>
        <p style={{ fontSize: 12, color: T?.mutedMid, marginTop: 12 }}>Drag edges to crop (Simulated UI)</p>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={btnStyle(T, "secondary")}>Cancel</button>
          <button type="button" onClick={() => onSave(src)} style={btnStyle(T, "primary")}>Save & Crop</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// EDIT PROFILE MODAL (Default Export)
// ─────────────────────────────────────────────────────────────────
export default function EditProfileModal({
  T, user, editName, setEditName, editHandle, setEditHandle, editBio, setEditBio,
  editUni, setEditUni, editFaculty, setEditFaculty, editRelationship, setEditRelationship,
  editGender, setEditGender, editPhone, setEditPhone, editHobby, setEditHobby, onSave, onClose
}) {
  
  // Image states. We keep BOTH the preview URL (for display) and the real
  // File object (so the parent can actually upload it to Supabase Storage —
  // previously only the throwaway blob URL was kept, which is why avatar/
  // cover edits never survived a refresh).
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || user?.avatar || null);
  const [coverPreview, setCoverPreview] = useState(user?.coverUrl || user?.cover || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [croppingImage, setCroppingImage] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'avatar' or 'cover'
  const [pendingFile, setPendingFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCroppingImage(url);
      setCropTarget(target);
      setPendingFile(file);
    }
    e.target.value = ""; // allow re-selecting the same file later
  };

  const saveCroppedImage = (url) => {
    if (cropTarget === 'avatar') { setAvatarPreview(url); setAvatarFile(pendingFile); }
    if (cropTarget === 'cover')  { setCoverPreview(url);  setCoverFile(pendingFile); }
    setCroppingImage(null);
    setPendingFile(null);
  };

  return (
    <>
      <div style={overlayStyle}>
        <div style={{ ...glass(T), width: "100%", maxWidth: 440, borderRadius: 18, maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T?.divider}`, position: "sticky", top: 0, background: T?.isDark ? "#0F1419" : "#fff", zIndex: 1, borderRadius: "18px 18px 0 0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: T?.text }}>Edit Profile</h3>
            <div onClick={onClose} style={{ cursor: "pointer", padding: 4, borderRadius: "50%", background: T?.hoverBg, display: "flex" }}>
              <X size={18} color={T?.muted} />
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            if (saving) return;
            setSaving(true);
            try {
              await onSave({ avatarFile, coverFile, avatarPreview, coverPreview });
            } finally {
              setSaving(false);
            }
          }} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Cover Photo Slot */}
            <Field label="Cover Photo" T={T}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ width: "100%", height: 90, borderRadius: 8, border: `1px solid ${T?.inputBorder}`, overflow: "hidden", background: T?.isDark ? "#0F1419" : "#E5E7EB" }}>
                  {coverPreview && <img src={coverPreview} alt="Cover Layout" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" disabled={!coverPreview} onClick={() => coverPreview && setViewingImage(coverPreview)} style={{ ...btnStyle(T, "secondary"), opacity: coverPreview ? 1 : 0.5, cursor: coverPreview ? "pointer" : "default" }}><ImageIcon size={14} /> Preview Large</button>
                  <label style={btnStyle(T, "secondary", { cursor: "pointer" })}>
                    <Crop size={14} /> Upload & Crop
                    <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'cover')} />
                  </label>
                </div>
              </div>
            </Field>

            {/* Avatar Photo Slot */}
            <Field label="Avatar Photo" T={T}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid ${T?.inputBorder}`, overflow: "hidden", background: T?.isDark ? "#0F1419" : "#E5E7EB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: T?.mutedMid, fontSize: 18, fontWeight: 700 }}>
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar Layout" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user?.name || "U")[0].toUpperCase()}
                </div>
                <div style={{ display: "flex", gap: 10, flex: 1 }}>
                  <button type="button" disabled={!avatarPreview} onClick={() => avatarPreview && setViewingImage(avatarPreview)} style={{ ...btnStyle(T, "secondary"), opacity: avatarPreview ? 1 : 0.5, cursor: avatarPreview ? "pointer" : "default" }}><ImageIcon size={14} /> Preview Large</button>
                  <label style={btnStyle(T, "secondary", { cursor: "pointer" })}>
                    <Crop size={14} /> Upload & Crop
                    <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'avatar')} />
                  </label>
                </div>
              </div>
            </Field>

            {/* Standard Fields */}
            <Field label="Display Name" T={T}>
              <input type="text" value={editName} required onChange={e => setEditName(e.target.value)} placeholder="Your full name" style={inputStyle(T)} />
            </Field>
            <Field label="Username" T={T}>
              <div style={{ display: "flex", alignItems: "center", ...inputContainerStyle(T) }}>
                <span style={{ color: accent(T), fontWeight: 700, paddingLeft: 10, paddingRight: 2, fontSize: 14 }}>@</span>
                <input type="text" value={editHandle.replace(/^@/, "")} required onChange={e => setEditHandle(e.target.value)} placeholder="yourhandle" style={{ ...inputStyle(T), border: "none", background: "none", flex: 1, padding: "10px 10px 10px 4px" }} />
              </div>
            </Field>
            <Field label="University" T={T}>
              <SearchableUniDropdown T={T} value={editUni} onChange={val => { setEditUni(val); setEditFaculty(""); }} />
            </Field>
            <Field label="Faculty / School" T={T}>
              {isFUTA(editUni) ? (
                <select value={editFaculty} required onChange={e => setEditFaculty(e.target.value)} style={{ ...inputStyle(T), background: T?.isDark ? "#12181E" : "#fff" }}>
                  <option value="">Select FUTA Faculty</option>
                  {FUTA_FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              ) : (
                <input type="text" value={editFaculty} placeholder="e.g. Faculty of Engineering" required onChange={e => setEditFaculty(e.target.value)} style={inputStyle(T)} />
              )}
            </Field>
            <Field label="Gender" T={T}>
              <div style={{ display: "flex", gap: 12 }}>
                {["Male", "Female"].map(g => (
                  <label key={g} style={radioLabelStyle(T, editGender === g)}>
                    <input type="radio" name="gender" value={g} checked={editGender === g} onChange={() => setEditGender(g)} style={{ display: "none" }} />{g}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Relationship Status" T={T}>
              <div style={{ display: "flex", gap: 12 }}>
                {["Single", "Taken"].map(r => (
                  <label key={r} style={radioLabelStyle(T, editRelationship === r)}>
                    <input type="radio" name="relationship" value={r} checked={editRelationship === r} onChange={() => setEditRelationship(r)} style={{ display: "none" }} />{r}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Phone Number" T={T}>
              <div style={{ display: "flex", alignItems: "center", ...inputContainerStyle(T) }}>
                <span style={{ fontSize: 13, color: T?.mutedMid, fontWeight: 600, padding: "0 6px 0 12px", borderRight: `1px solid ${T?.divider}`, marginRight: 8 }}>+234</span>
                <input type="text" value={editPhone} required maxLength={10} placeholder="8012345678" onChange={e => setEditPhone(e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle(T), border: "none", background: "none", flex: 1, padding: "10px 10px 10px 0" }} />
              </div>
            </Field>
            <Field label="Hobby" T={T}>
              <div style={{ display: "flex", alignItems: "center", ...inputContainerStyle(T) }}>
                <span style={{ fontSize: 13, color: accent(T), fontWeight: 700, padding: "0 6px 0 12px", whiteSpace: "nowrap", borderRight: `1px solid ${T?.divider}`, marginRight: 8 }}>I love</span>
                <input type="text" value={editHobby} required placeholder="coding and deep learning" onChange={e => setEditHobby(e.target.value)} style={{ ...inputStyle(T), border: "none", background: "none", flex: 1, padding: "10px 10px 10px 0" }} />
              </div>
            </Field>
            <Field label="Bio" T={T}>
              <textarea value={editBio} rows={3} onChange={e => setEditBio(e.target.value)} placeholder="Tell the campus about yourself..." style={{ ...inputStyle(T), resize: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={btnStyle(T, "secondary")}>Cancel</button>
              <button type="submit" disabled={saving} style={{ ...btnStyle(T, "primary"), opacity: saving ? 0.7 : 1, cursor: saving ? "default" : "pointer" }}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        </div>
      </div>

      {viewingImage && <ImagePreviewModal src={viewingImage} onClose={() => setViewingImage(null)} T={T} />}
      {croppingImage && <CropSimulateModal src={croppingImage} onSave={saveCroppedImage} onClose={() => setCroppingImage(null)} T={T} />}
    </>
  );
}