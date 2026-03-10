import { useState } from "react";
import "./App.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "analytics", label: "Google Analytics", icon: "📊" },
  { id: "looker",    label: "Looker Studio",    icon: "📈" },
  { id: "content",   label: "Content & Keywords", icon: "✍️" },
  { id: "ads",       label: "Google Ads",        icon: "🎯" },
  { id: "display",   label: "Display & Retargeting", icon: "🖥️" },
  { id: "social",    label: "Social Media",      icon: "📱" },
  { id: "leads",     label: "Form Leads",        icon: "📋" },
];

const GA_STATS = [
  { label: "Sessions",    value: "12,840", change: "+8.2%"  },
  { label: "Users",       value: "9,210",  change: "+5.1%"  },
  { label: "Pageviews",   value: "34,502", change: "+12.4%" },
  { label: "Bounce Rate", value: "38.4%",  change: "-2.1%"  },
  { label: "Avg. Session",value: "2m 41s", change: "+0:14"  },
];

const TOP_PAGES = [
  { page: "/services/roofing-repair",    views: 4210, pct: 100 },
  { page: "/contact",                    views: 3180, pct: 76  },
  { page: "/about",                      views: 2340, pct: 56  },
  { page: "/blog/metal-roofing-guide",   views: 1900, pct: 45  },
  { page: "/gallery",                    views: 1450, pct: 34  },
];

const WEEKLY = [820, 950, 1100, 870, 1340, 1560, 1200];
const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const CONTENT_ITEMS = [
  { id:1, title:"Ultimate Guide to Metal Roofing in 2025",         date:"Mar 2, 2025",  keywords:["metal roofing","roofing costs","durable roof materials"],        status:"Published" },
  { id:2, title:"Signs You Need Emergency Roof Repair",            date:"Feb 18, 2025", keywords:["emergency roof repair","roof leak repair","storm damage roof"],   status:"Published" },
  { id:3, title:"Residential vs Commercial Roofing",               date:"Jan 30, 2025", keywords:["commercial roofing","residential roofing","flat roof"],           status:"Published" },
  { id:4, title:"How to Choose a Roofing Contractor",              date:"Apr 5, 2025",  keywords:["roofing contractor near me","best roofer","licensed roofer"],      status:"Draft"     },
];

const ADS_SUMMARY = [
  { label:"Total Spend",  value:"$4,219"   },
  { label:"Clicks",       value:"3,840"    },
  { label:"Impressions",  value:"142,600"  },
  { label:"Avg. CPC",     value:"$1.10"    },
  { label:"CTR",          value:"2.69%"    },
  { label:"Conversions",  value:"94"       },
  { label:"Cost / Conv.", value:"$44.88"   },
];

const ADS_CAMPAIGNS = [
  { name:"Brand – Exact Match",     spend:"$820",   clicks:940,  impressions:"12,400", cpc:"$0.87", ctr:"7.58%", conv:31 },
  { name:"Roofing Repair – Broad",  spend:"$1,340", clicks:1210, impressions:"54,200", cpc:"$1.11", ctr:"2.23%", conv:28 },
  { name:"Storm Damage – Phrase",   spend:"$980",   clicks:890,  impressions:"38,100", cpc:"$1.10", ctr:"2.34%", conv:22 },
  { name:"Competitor Conquesting",  spend:"$1,079", clicks:800,  impressions:"37,900", cpc:"$1.35", ctr:"2.11%", conv:13 },
];

const DISPLAY_SUMMARY = [
  { label:"Impressions", value:"284,500" },
  { label:"Clicks",      value:"1,420"   },
  { label:"CTR",         value:"0.50%"   },
  { label:"Total Spend", value:"$1,105"  },
  { label:"Conversions", value:"38"      },
  { label:"CPA",         value:"$29.08"  },
];

const DISPLAY_AUDIENCES = [
  { name:"Website Visitors (30d)",    impressions:"120,000", clicks:680, ctr:"0.57%", spend:"$480", conv:18 },
  { name:"Cart Abandoners",           impressions:"64,500",  clicks:340, ctr:"0.53%", spend:"$270", conv:11 },
  { name:"Engaged Users (2+ pages)",  impressions:"100,000", clicks:400, ctr:"0.40%", spend:"$355", conv: 9 },
];

const SOCIAL_POSTS = [
  { id:1, platform:"Facebook",  date:"Mar 8, 2025",  content:"Spring is here — is your roof ready? 🌦️ Check out our seasonal inspection checklist before the heavy rains hit.", likes:84,  comments:12, shares:31, reach:"3,200" },
  { id:2, platform:"Instagram", date:"Mar 5, 2025",  content:"Before & after — this storm-damaged roof went from eyesore to showstopper in just two days. 💪 #RoofingExperts",  likes:210, comments:27, shares:18, reach:"5,800" },
  { id:3, platform:"Facebook",  date:"Feb 28, 2025", content:"Did you know most homeowners insurance covers storm damage? We help you navigate the claims process.",             likes:63,  comments:8,  shares:44, reach:"2,900" },
  { id:4, platform:"Instagram", date:"Feb 20, 2025", content:"Metal roofing: beautiful, durable, and built to last 50+ years. Ask us about our new color options! 🏠",           likes:178, comments:19, shares:22, reach:"4,400" },
];

const LEADS = [
  { id:1, name:"James Kowalski", email:"james.k@email.com",  phone:"(617) 555-0182", form:"Free Estimate",   message:"Need a full roof replacement after hail damage last week.",            date:"Mar 9, 2025",  status:"New"       },
  { id:2, name:"Sandra Reyes",   email:"sreyes@email.com",   phone:"(508) 555-0341", form:"Contact Us",      message:"Looking for a quote on a commercial flat roof repair.",               date:"Mar 7, 2025",  status:"Contacted" },
  { id:3, name:"Tom Nguyen",     email:"tom.n@email.com",    phone:"(781) 555-0097", form:"Free Estimate",   message:"Interested in metal roofing for my new construction home.",           date:"Mar 5, 2025",  status:"Qualified" },
  { id:4, name:"Patricia Walsh", email:"pwalsh@email.com",   phone:"(617) 555-0228", form:"Emergency Repair",message:"Active leak in my living room ceiling — urgent.",                     date:"Mar 3, 2025",  status:"Closed"    },
];

const PLATFORM_COLOR = { Facebook:"#1877F2", Instagram:"#E1306C", LinkedIn:"#0A66C2" };
const STATUS_COLOR    = { New:"#3B82F6", Contacted:"#F59E0B", Qualified:"#10B981", Closed:"#6B7280" };

// ── Components ────────────────────────────────────────────────────────────────

function WeeklyChart({ data, days }) {
  const max = Math.max(...data);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:90 }}>
      {data.map((v,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <div style={{ width:"100%", height:`${(v/max)*78}px`, background:"linear-gradient(180deg,#6366f1,#4f46e5)", borderRadius:"4px 4px 0 0", transition:"height 0.4s ease" }} />
          <span style={{ fontSize:10, color:"#64748b" }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, change }) {
  return (
    <div className="card stat-card" style={{ padding:"20px 18px" }}>
      <div className="label">{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.02em", margin:"6px 0 4px" }}>{value}</div>
      <div style={{ fontSize:12, color:"#34d399" }}>{change} vs prior period</div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="card stat-card" style={{ padding:"18px 14px", textAlign:"center" }}>
      <div className="label" style={{ marginBottom:7 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.02em" }}>{value}</div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (email === "client@demo.com" && password === "demo1234") {
      onLogin();
    } else {
      setError("Invalid credentials. Try client@demo.com / demo1234");
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Agency logo */}
        <div className="logo-drop" style={{ height:72, marginBottom:36 }}>
          <div>
            <div style={{ fontSize:22, marginBottom:4 }}>🏢</div>
            <div>Place your agency logo here</div>
          </div>
        </div>

        <div style={{ textAlign:"center", marginBottom:28 }}>
          <h1 style={{ fontSize:24, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.02em", marginBottom:6 }}>Client Portal</h1>
          <p style={{ fontSize:13, color:"#475569" }}>Sign in to view your marketing dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input className="field" type="email"    placeholder="Email address" value={email}    onChange={e => setEmail(e.target.value)} required />
          <input className="field" type="password" placeholder="Password"      value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="error-box">{error}</div>}
          <button className="btn-primary" type="submit">Sign In →</button>
        </form>
        <p style={{ textAlign:"center", marginTop:18, fontSize:11, color:"#334155" }}>Demo: client@demo.com / demo1234</p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn,     setLoggedIn]     = useState(false);
  const [activeTab,    setActiveTab]    = useState("analytics");
  const [selectedLead, setSelectedLead] = useState(null);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="dashboard-root">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Agency logo */}
        <div style={{ padding:"0 14px 16px", borderBottom:"1px solid #1a1d2e" }}>
          <div className="logo-drop" style={{ height:52, fontSize:11 }}>
            Agency Logo
          </div>
        </div>

        {/* Client logo + name */}
        <div style={{ padding:"14px 14px 16px", borderBottom:"1px solid #1a1d2e" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"#13151f", borderRadius:10, padding:"10px 12px" }}>
            <div className="logo-drop" style={{ width:38, height:38, minWidth:38, borderRadius:8, fontSize:9, lineHeight:1.3 }}>
              Client Logo
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>Apex Roofing Co.</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>Client Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"14px 10px", display:"flex", flexDirection:"column", gap:2 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-btn${activeTab === tab.id ? " active" : ""}`}
              onClick={() => { setActiveTab(tab.id); setSelectedLead(null); }}
            >
              <span style={{ fontSize:15 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:"0 14px" }}>
          <button className="btn-signout" onClick={() => setLoggedIn(false)}>← Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">

        {/* Page header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
          <div>
            <div style={{ fontSize:11, color:"#6366f1", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5 }}>
              {currentTab?.label}
            </div>
            <h1 style={{ fontSize:28, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.03em", lineHeight:1 }}>
              { activeTab==="analytics" && "Website Analytics"       }
              { activeTab==="looker"    && "Looker Studio Reports"    }
              { activeTab==="content"   && "Content & Keywords"       }
              { activeTab==="ads"       && "Google Ads Performance"   }
              { activeTab==="display"   && "Display & Retargeting"    }
              { activeTab==="social"    && "Social Media Posts"       }
              { activeTab==="leads"     && "Form Leads"               }
            </h1>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#475569", marginBottom:3 }}>Reporting Period</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8" }}>Mar 1 – Mar 10, 2025</div>
          </div>
        </div>

        {/* ── ANALYTICS ── */}
        {activeTab === "analytics" && (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div className="grid-5">
              {GA_STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>
            <div className="grid-chart">
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", marginBottom:2 }}>Weekly Sessions</div>
                <div style={{ fontSize:11, color:"#334155", marginBottom:16 }}>Last 7 days</div>
                <WeeklyChart data={WEEKLY} days={DAYS} />
              </div>
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", marginBottom:18 }}>Top Pages</div>
                <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  {TOP_PAGES.map(p => (
                    <div key={p.page}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:12, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"75%" }}>{p.page}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:"#e2e8f0" }}>{p.views.toLocaleString()}</span>
                      </div>
                      <div style={{ height:4, background:"#1e2235", borderRadius:4 }}>
                        <div style={{ height:"100%", width:`${p.pct}%`, background:"linear-gradient(90deg,#6366f1,#818cf8)", borderRadius:4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LOOKER ── */}
        {activeTab === "looker" && (
          <div className="card" style={{ padding:28 }}>
            <p style={{ fontSize:13, color:"#475569", marginBottom:16 }}>Paste your Looker Studio embed URL below to display your live report.</p>
            <div style={{ display:"flex", gap:10, marginBottom:24 }}>
              <input className="field" placeholder="https://lookerstudio.google.com/embed/reporting/…" style={{ flex:1 }} />
              <button className="btn-primary" style={{ whiteSpace:"nowrap", padding:"11px 22px" }}>Load Report</button>
            </div>
            <div className="empty-frame">
              <div style={{ fontSize:44 }}>📈</div>
              <div style={{ fontSize:15, fontWeight:600, color:"#64748b" }}>Looker Studio Report</div>
              <div style={{ fontSize:12, color:"#334155", textAlign:"center", maxWidth:320 }}>Your report will appear here once a valid embed URL is configured.</div>
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {activeTab === "content" && (
          <div className="card" style={{ padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <span style={{ fontSize:13, color:"#64748b" }}>{CONTENT_ITEMS.length} articles tracked</span>
              <div style={{ display:"flex", gap:8 }}>
                <span className="badge" style={{ background:"rgba(52,211,153,0.1)", color:"#34d399" }}>● Published</span>
                <span className="badge" style={{ background:"rgba(251,191,36,0.1)",  color:"#fbbf24" }}>● Draft</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {CONTENT_ITEMS.map(item => (
                <div key={item.id} className="content-row">
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0", marginBottom:10 }}>{item.title}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {item.keywords.map(kw => <span key={kw} className="kw-tag">🔍 {kw}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", minWidth:100 }}>
                    <span className="badge" style={{ background: item.status==="Published" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: item.status==="Published" ? "#34d399" : "#fbbf24", marginBottom:8, display:"block" }}>
                      {item.status}
                    </span>
                    <div style={{ fontSize:11, color:"#475569" }}>{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADS ── */}
        {activeTab === "ads" && (
          <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
            <div className="grid-7">
              {ADS_SUMMARY.map(s => <SummaryCard key={s.label} {...s} />)}
            </div>
            <div className="card" style={{ paddingTop:20 }}>
              <div style={{ padding:"0 20px 12px", fontSize:13, fontWeight:600, color:"#94a3b8" }}>Campaign Breakdown</div>
              <table>
                <thead><tr><th>Campaign</th><th>Spend</th><th>Clicks</th><th>Impressions</th><th>CPC</th><th>CTR</th><th>Conv.</th></tr></thead>
                <tbody>
                  {ADS_CAMPAIGNS.map(c => (
                    <tr key={c.name}>
                      <td style={{ color:"#e2e8f0", fontWeight:500 }}>{c.name}</td>
                      <td style={{ color:"#34d399", fontWeight:600 }}>{c.spend}</td>
                      <td>{c.clicks.toLocaleString()}</td>
                      <td>{c.impressions}</td>
                      <td>{c.cpc}</td>
                      <td>{c.ctr}</td>
                      <td><span className="badge" style={{ background:"rgba(99,102,241,0.13)", color:"#a5b4fc" }}>{c.conv}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DISPLAY ── */}
        {activeTab === "display" && (
          <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
            <div className="grid-6">
              {DISPLAY_SUMMARY.map(s => <SummaryCard key={s.label} {...s} />)}
            </div>
            <div className="card" style={{ paddingTop:20 }}>
              <div style={{ padding:"0 20px 12px", fontSize:13, fontWeight:600, color:"#94a3b8" }}>Retargeting Audiences</div>
              <table>
                <thead><tr><th>Audience</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Spend</th><th>Conv.</th></tr></thead>
                <tbody>
                  {DISPLAY_AUDIENCES.map(a => (
                    <tr key={a.name}>
                      <td style={{ color:"#e2e8f0", fontWeight:500 }}>{a.name}</td>
                      <td>{a.impressions}</td>
                      <td>{a.clicks.toLocaleString()}</td>
                      <td>{a.ctr}</td>
                      <td style={{ color:"#34d399", fontWeight:600 }}>{a.spend}</td>
                      <td><span className="badge" style={{ background:"rgba(99,102,241,0.13)", color:"#a5b4fc" }}>{a.conv}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SOCIAL ── */}
        {activeTab === "social" && (
          <div className="grid-2">
            {SOCIAL_POSTS.map(post => (
              <div key={post.id} className="card" style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <span className="badge" style={{ background: PLATFORM_COLOR[post.platform]+"22", color: PLATFORM_COLOR[post.platform] }}>{post.platform}</span>
                  <span style={{ fontSize:11, color:"#475569" }}>{post.date}</span>
                </div>
                <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, marginBottom:18 }}>{post.content}</p>
                <div className="post-stats">
                  {[["❤️","Likes",post.likes],["💬","Comments",post.comments],["🔁","Shares",post.shares],["👁️","Reach",post.reach]].map(([icon,lbl,val]) => (
                    <div key={lbl} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:11, color:"#475569", marginBottom:3 }}>{icon} {lbl}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:"#e2e8f0" }}>{typeof val==="number" ? val.toLocaleString() : val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LEADS ── */}
        {activeTab === "leads" && (
          <div style={{ display:"grid", gridTemplateColumns: selectedLead ? "1fr 360px" : "1fr", gap:20 }}>
            <div className="card" style={{ paddingTop:20 }}>
              <div style={{ padding:"0 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>{LEADS.length} leads from Gravity Forms</span>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {Object.entries(STATUS_COLOR).map(([s,c]) => (
                    <span key={s} className="badge" style={{ background:c+"20", color:c }}>{s}</span>
                  ))}
                </div>
              </div>
              <table>
                <thead><tr><th>Contact</th><th>Form</th><th>Date</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {LEADS.map(lead => (
                    <tr key={lead.id} style={{ cursor:"pointer" }} onClick={() => setSelectedLead(lead)}>
                      <td>
                        <div style={{ color:"#e2e8f0", fontWeight:600 }}>{lead.name}</div>
                        <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{lead.email}</div>
                      </td>
                      <td style={{ color:"#a5b4fc" }}>{lead.form}</td>
                      <td>{lead.date}</td>
                      <td><span className="badge" style={{ background:STATUS_COLOR[lead.status]+"20", color:STATUS_COLOR[lead.status] }}>{lead.status}</span></td>
                      <td style={{ color:"#6366f1", fontSize:20, fontWeight:300 }}>›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedLead && (
              <div className="card" style={{ padding:24, alignSelf:"start" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>{selectedLead.name}</div>
                  <button onClick={() => setSelectedLead(null)} style={{ background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer" }}>✕</button>
                </div>
                {[["Email",selectedLead.email],["Phone",selectedLead.phone],["Form",selectedLead.form],["Received",selectedLead.date]].map(([k,v]) => (
                  <div key={k} style={{ marginBottom:14 }}>
                    <div className="label" style={{ marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:13, color:"#cbd5e1" }}>{v}</div>
                  </div>
                ))}
                <div style={{ marginBottom:20 }}>
                  <div className="label" style={{ marginBottom:6 }}>Message</div>
                  <div style={{ background:"#0f1117", border:"1px solid #1e2235", borderRadius:9, padding:"12px 14px", fontSize:13, color:"#94a3b8", lineHeight:1.6 }}>
                    {selectedLead.message}
                  </div>
                </div>
                <div>
                  <div className="label" style={{ marginBottom:8 }}>Lead Status</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {Object.entries(STATUS_COLOR).map(([s,c]) => (
                      <span key={s} className="badge" style={{ background:c+"20", color:c, cursor:"pointer", border: selectedLead.status===s ? `1px solid ${c}` : "1px solid transparent" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
