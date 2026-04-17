import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

const supabase = createClient(
  "https://pwkqtiuqxlhxcrjmrmhe.supabase.co",
  "sb_publishable_2fEX9SGp-_TI3H4mgiEivw_99BW4uqf"
);

const BUCKET = "party-photos";

const EVENT = {
  title: "Baby Perez Diaper Party",
  subtitle: "Bring a pack of diapers • 🍻 Keg Provided",
  date: "Saturday, July 25, 2026",
  time: "6:00 PM",
  location: "23529 Tamarack St NW, St Francis, MN 55070",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=23529%20Tamarack%20St%20NW%2C%20St%20Francis%2C%20MN%2055070",
  description:
    "Come hang out, bring diapers, enjoy drinks on us, and help us celebrate Baby Perez before the little one arrives.",
  foodNote: "🌮 Walking tacos will be served!",
  photoNote: "Share a photo of dad or from the party 📸",
};

export default function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [poolName, setPoolName] = useState("");
  const [guessDate, setGuessDate] = useState("");
  const [guessWeight, setGuessWeight] = useState("");

  const [photo, setPhoto] = useState(null);

  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [poolGuesses, setPoolGuesses] = useState([]);

  const [loadingGallery, setLoadingGallery] = useState(false);
  const [loadingRsvps, setLoadingRsvps] = useState(false);
  const [loadingPool, setLoadingPool] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const loadRsvps = async () => {
    setLoadingRsvps(true);

    const { data, error } = await supabase
      .from("party_rsvps")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoadingRsvps(false);
      return;
    }

    setRsvps(data || []);
    setLoadingRsvps(false);
  };

  const loadPoolGuesses = async () => {
    setLoadingPool(true);

    const { data, error } = await supabase
      .from("baby_pool_guesses")
      .select("*")
      .order("guess_date", { ascending: true });

    if (error) {
      alert(error.message);
      setLoadingPool(false);
      return;
    }

    setPoolGuesses(data || []);
    setLoadingPool(false);
  };

  const loadPhotos = async () => {
    setLoadingGallery(true);

    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });

    if (error) {
      alert(error.message);
      setLoadingGallery(false);
      return;
    }

    const imageFiles = (data || []).filter((file) => {
      const lower = file.name.toLowerCase();
      return (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".gif")
      );
    });

    const mapped = imageFiles.map((file) => {
      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(file.name);

      return {
        id: file.id || file.name,
        name: file.name,
        url: publicData.publicUrl,
      };
    });

    setPhotos(mapped);
    setLoadingGallery(false);
  };

  useEffect(() => {
    loadRsvps();
    loadPoolGuesses();
    loadPhotos();
  }, []);

  const submitRSVP = async () => {
    if (!name.trim()) {
      alert("Enter your name first.");
      return;
    }

    const { error } = await supabase.from("party_rsvps").insert([
      {
        name: name.trim(),
        email: email.trim() || null,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setEmail("");
    showMessage("RSVP submitted 🔥");
    loadRsvps();
  };

  const submitGuess = async () => {
    if (!poolName.trim()) {
      alert("Enter your name for the baby pool.");
      return;
    }

    if (!guessDate) {
      alert("Pick a date guess first.");
      return;
    }

    const { error } = await supabase.from("baby_pool_guesses").insert([
      {
        name: poolName.trim(),
        guess_date: guessDate,
        guess_weight: guessWeight.trim() || null,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setPoolName("");
    setGuessDate("");
    setGuessWeight("");
    showMessage("Baby pool guess submitted 👶");
    loadPoolGuesses();
  };

  const uploadPhoto = async () => {
    if (!photo) {
      alert("Choose a photo first.");
      return;
    }

    const fileName = `${Date.now()}-${photo.name.replace(/\s+/g, "-")}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, photo, { upsert: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPhoto(null);
    showMessage("Photo uploaded 📸");
    loadPhotos();
  };

  const downloadSinglePhoto = async (url, fileName) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);
  };

  const downloadAllPhotos = async () => {
    if (!photos.length) return;

    setDownloadingAll(true);

    try {
      const zip = new JSZip();

      for (const photoItem of photos) {
        const response = await fetch(photoItem.url);
        const blob = await response.blob();
        zip.file(photoItem.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = window.URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "baby-perez-party-photos.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(zipUrl);
      showMessage("Downloading all photos 📦");
    } catch (error) {
      alert("Download failed.");
    } finally {
      setDownloadingAll(false);
    }
  };

  const totalRsvps = useMemo(() => rsvps.length, [rsvps]);

  return (
    <div className="page">
      <div className="hero-card shimmer">
        <div className="badge">Hosted for Baby Perez</div>

        <h1 className="headline">{EVENT.title}</h1>

        <p className="subhead">{EVENT.subtitle}</p>

        <p className="description">{EVENT.description}</p>
        <p className="description" style={{ marginTop: 10 }}>
          {EVENT.foodNote}
        </p>

        <div className="details-grid">
          <div className="info-box glow">
            <div className="info-label">Date &amp; Time</div>
            <div className="info-value">{EVENT.date}</div>
            <div className="info-value">{EVENT.time}</div>
          </div>

          <a
            className="info-box glow location-link"
            href={EVENT.mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <div className="info-label">Location</div>
            <div className="info-value">{EVENT.location}</div>
            <div className="tap-text">Tap to open in maps</div>
          </a>
        </div>

        <div className="stats-row">
          <div className="stat-pill">
            <span className="stat-label">Current RSVPs</span>
            <span className="stat-value">
              {loadingRsvps ? "..." : totalRsvps}
            </span>
          </div>

          <button className="secondary-btn refresh-btn" onClick={loadRsvps}>
            Refresh Count
          </button>
        </div>
      </div>

      {message ? <div className="message">{message}</div> : null}

      <div className="grid">
        <div className="card shimmer">
          <h2>RSVP</h2>
          <input
            className="field"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="gold-btn" onClick={submitRSVP}>
            Submit RSVP
          </button>
        </div>

        <div className="card shimmer">
          <h2>Baby Pool</h2>
          <input
            className="field"
            placeholder="Your name"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
          />
          <input
            className="field"
            type="date"
            value={guessDate}
            onChange={(e) => setGuessDate(e.target.value)}
          />
          <input
            className="field"
            placeholder="Optional: baby weight guess"
            value={guessWeight}
            onChange={(e) => setGuessWeight(e.target.value)}
          />
          <button className="gold-btn" onClick={submitGuess}>
            Submit Guess
          </button>
        </div>

        <div className="card shimmer">
          <h2>Upload Photo</h2>
          <p style={{ marginBottom: 12, color: "#ffe08a" }}>
            {EVENT.photoNote}
          </p>
          <input
            className="field file-field"
            type="file"
            onChange={(e) => setPhoto(e.target.files[0])}
          />
          <button className="gold-btn" onClick={uploadPhoto}>
            Upload
          </button>
        </div>
      </div>

      <div className="card shimmer leaderboard-card">
        <div className="leaderboard-header">
          <h2>Who&apos;s Coming</h2>
        </div>

        {!rsvps.length ? (
          <p className="empty-text">No RSVPs yet.</p>
        ) : (
          <div className="leaderboard-list">
            {rsvps.map((person, index) => (
              <div
                key={person.id || `${person.name}-${index}`}
                className="leaderboard-row"
              >
                <div className="leaderboard-rank">#{index + 1}</div>
                <div className="leaderboard-main">
                  <div className="leaderboard-name">{person.name}</div>
                  <div className="leaderboard-meta">
                    {person.email || "Party confirmed"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card shimmer leaderboard-card">
        <div className="leaderboard-header">
          <h2>Baby Pool Leaderboard</h2>
          <button
            className="secondary-btn refresh-btn"
            onClick={loadPoolGuesses}
          >
            {loadingPool ? "Refreshing..." : "Refresh Pool"}
          </button>
        </div>

        {!poolGuesses.length ? (
          <p className="empty-text">No guesses yet.</p>
        ) : (
          <div className="leaderboard-list">
            {poolGuesses.map((guess, index) => (
              <div
                key={guess.id || `${guess.name}-${index}`}
                className="leaderboard-row"
              >
                <div className="leaderboard-rank">#{index + 1}</div>
                <div className="leaderboard-main">
                  <div className="leaderboard-name">{guess.name}</div>
                  <div className="leaderboard-meta">
                    Guess: {guess.guess_date}
                    {guess.guess_weight
                      ? ` • Weight: ${guess.guess_weight}`
                      : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card shimmer gallery-card">
        <div className="gallery-header">
          <h2>Photo Gallery</h2>
          <div className="gallery-actions">
            <button className="secondary-btn" onClick={loadPhotos}>
              {loadingGallery ? "Refreshing..." : "Refresh Gallery"}
            </button>
            <button className="gold-btn small-btn" onClick={downloadAllPhotos}>
              {downloadingAll ? "Preparing Zip..." : "Download All"}
            </button>
          </div>
        </div>

        {!photos.length ? (
          <p className="empty-text">
            No photos yet. Upload one above and it’ll appear here.
          </p>
        ) : (
          <div className="gallery-grid">
            {photos.map((item) => (
              <div key={item.id} className="photo-card">
                <img src={item.url} alt={item.name} className="gallery-image" />
                <div className="photo-meta">
                  <div className="photo-name">{item.name}</div>
                  <button
                    className="secondary-btn"
                    onClick={() => downloadSinglePhoto(item.url, item.name)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card shimmer">
        <h2>Event Highlights</h2>
        <ul style={{ lineHeight: "1.8", color: "#ffe08a", paddingLeft: 20 }}>
          <li>🍻 Keg provided</li>
          <li>🌮 Walking tacos</li>
          <li>📸 Share photos of dad or from the party</li>
          <li>🎯 Baby pool competition</li>
          <li>🎉 Good vibes only</li>
        </ul>
      </div>
    </div>
  );
}
