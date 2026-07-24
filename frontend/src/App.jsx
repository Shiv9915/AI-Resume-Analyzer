import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
// import CountUp from "react-countup";
import Confetti from "react-confetti";
import { useState, useEffect } from "react";
import axios from "axios";
import { Upload, FileText, CheckCircle, XCircle, Download } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

import "react-pdf/dist/Page/TextLayer.css";
import { jsPDF } from "jspdf";
// import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [jobRole, setJobRole] = useState("Python Developer");
  const [animatedScore, setAnimatedScore] = useState(0);
  console.log("Render:", animatedScore);

  const [numPages, setNumPages] = useState(null);
  const [pageNumber] = useState(1);

  const handleUpload = async () => {
    console.log("");

    if (!file) {
      alert("Please select a resume.");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Please upload only PDF files.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_role", jobRole);

    setLoading(true);

    try {
      console.log("Sending Request...");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/upload-resume/`,
        formData,
      );

      console.log(response.data.summary);
      console.log(response.data.matched_skills);
      console.log(response.data.missing_skills);

      console.log("Response:", response);
      console.log("Data:", response.data);
      setResult(response.data);
      console.log(response.data.ats_score);
      console.log(typeof response.data.ats_score);
      console.log("Result State:", response.data);
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(error.response.data.message || "Upload failed.");
      } else {
        alert("Server is not responding. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadReport = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(20);
    pdf.text("AI Resume Analyzer Report", 20, 20);

    pdf.setFontSize(14);
    pdf.text(`Job Role: ${result.job_role}`, 20, 40);
    pdf.text(`ATS Score: ${result.ats_score}%`, 20, 50);

    pdf.text("Matched Skills:", 20, 70);
    pdf.text(result?.matched_skills?.join(", ") || "None", 20, 80);

    pdf.text("Missing Skills:", 20, 100);
    pdf.text(result?.missing_skills?.join(", ") || "None", 20, 110);

    pdf.text("AI Suggestions:", 20, 130);

    let y = 140;

    result.suggestions?.forEach((item) => {
      const lines = pdf.splitTextToSize("- " + item, 170);

      pdf.text(lines, 20, y);

      y += lines.length * 8;
    });

    pdf.save("ATS_Report.pdf");
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const scoreColor =
    result?.ats_score >= 75
      ? "#22c55e"
      : result?.ats_score >= 50
        ? "#eab308"
        : "#ef4444";

  useEffect(() => {
    console.log("useEffect called", result);

    if (!result) return;

    let current = 0;

    const interval = setInterval(() => {
      current += 2;

      console.log(current);

      setAnimatedScore(current);

      if (current >= result.ats_score) {
        setAnimatedScore(result.ats_score);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [result]);

  useEffect(() => {
    console.log("Result Changed:", result);
  }, [result]);

  const scoreLabel =
    result?.ats_score >= 80
      ? "Excellent Resume 🚀"
      : result?.ats_score >= 60
        ? "Good Resume 👍"
        : "Needs Improvement ⚠️";

  const rating =
    result?.ats_score >= 90
      ? {
          title: "Excellent",
          color: "bg-green-600",
          icon: "🏆",
        }
      : result?.ats_score >= 75
        ? {
            title: "Very Good",
            color: "bg-blue-600",
            icon: "🥈",
          }
        : result?.ats_score >= 60
          ? {
              title: "Good",
              color: "bg-yellow-500",
              icon: "👍",
            }
          : {
              title: "Needs Improvement",
              color: "bg-red-600",
              icon: "⚠️",
            };

  const breakdown = {
    skills: Math.min(
      100,
      Math.round((result?.matched_skills?.length || 0) * 10),
    ),

    projects: result?.text?.toLowerCase()?.includes("project") ? 90 : 40,

    experience: result?.text?.toLowerCase()?.includes("experience") ? 80 : 30,

    education:
      result?.text?.toLowerCase().includes("b.tech") ||
      result?.text?.toLowerCase().includes("btech") ||
      result?.text?.toLowerCase().includes("bachelor")
        ? 100
        : 50,

    formatting: 80,
  };

  const pieData = [
    {
      name: "Matched",
      value: result?.summary?.matched || 0,
    },
    {
      name: "Missing",
      value: result?.summary?.missing || 0,
    },
  ];

  const barData = [
    {
      name: "Skills",
      score: breakdown.skills,
    },
    {
      name: "Projects",
      score: breakdown.projects,
    },
    {
      name: "Experience",
      score: breakdown.experience,
    },
    {
      name: "Education",
      score: breakdown.education,
    },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  const analysis = [
    {
      title: "Strong Skills Match",
      status: breakdown.skills >= 70,
    },
    {
      title: "Projects Section",
      status: breakdown.projects >= 70,
    },
    {
      title: "Experience Section",
      status: breakdown.experience >= 70,
    },
    {
      title: "Education Section",
      status: breakdown.education >= 70,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      {result && result.ats_score >= 80 && <Confetti />}
      <div className="bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-white text-center">
          🤖 AI Resume Analyzer
        </h1>
        <p className="text-gray-400 text-center mt-2 mb-8">
          Upload your resume and check your ATS score instantly
        </p>
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`block w-full cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 mb-6
    ${
      dragActive
        ? "border-green-400 bg-slate-600 scale-105"
        : "border-slate-500 bg-slate-700 hover:border-blue-500 hover:bg-slate-600"
    }`}
        >
          <Upload className="mx-auto text-blue-400 mb-4" size={50} />

          <h3 className="text-white text-xl font-semibold">
            Upload Your Resume
          </h3>

          <p className="text-gray-400 mt-2">
            Drag & Drop your PDF here or Click to Browse
          </p>

          {dragActive && (
            <p className="text-green-400 font-semibold mt-3">
              📂 Drop your resume here...
            </p>
          )}

          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {file && (
            <p className="text-green-400 text-center mt-3">✅ {file.name}</p>
          )}
        </label>
        {file && (
          <div className="mb-6 bg-slate-700 rounded-xl p-4">
            <h3 className="text-white text-xl font-semibold mb-4">
              📄 Resume Preview
            </h3>

            <div className="flex justify-center overflow-auto">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => console.log("PDF Error:", error)}
              >
                <Page pageNumber={pageNumber} width={350} />
              </Document>
            </div>

            <p className="text-center text-gray-400 mt-3">
              Page {pageNumber} of {numPages}
            </p>
          </div>
        )}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">
            Select Job Role
          </label>

          <select
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Python Developer</option>
            <option>React Developer</option>
            <option>Django Developer</option>
            <option>MERN Stack Developer</option>
            <option>Java Developer</option>
            <option>Full Stack Developer</option>
            <option>Data Analyst</option>
          </select>
        </div>
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white py-3 rounded-lg font-semibold transition duration-300"
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
        {result && (
          <button
            onClick={downloadReport}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Download size={20} />
            Download ATS Report
          </button>
        )}
        {loading && (
          <div className="flex flex-col items-center mt-6">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-gray-300 mt-3">
              🤖 AI is analyzing your resume...
            </p>
          </div>
        )}
        {result && (
          <div className="mt-8">
            <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-center shadow-lg">
              <h3 className="text-white text-lg font-bold">
                📄 Resume Analysis Completed
              </h3>

              <p className="text-blue-100 mt-2">
                Your resume has been analyzed successfully for the selected job
                role.
              </p>
            </div>
            <div className="bg-slate-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white text-center">
                ATS Score
              </h2>

              <div className="grid md:grid-cols-4 gap-4 mt-8">
                <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-xl p-5 text-center shadow-lg">
                  <h3 className="text-white text-lg font-bold">Skills</h3>

                  <p className="text-3xl font-bold text-white mt-2">
                    {breakdown.skills}%
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-5 text-center shadow-lg">
                  <h3 className="text-white text-lg font-bold">Projects</h3>

                  <p className="text-3xl font-bold text-white mt-2">
                    {breakdown.projects}%
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl p-5 text-center shadow-lg">
                  <h3 className="text-white text-lg font-bold">Experience</h3>

                  <p className="text-3xl font-bold text-white mt-2">
                    {breakdown.experience}%
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-xl p-5 text-center shadow-lg">
                  <h3 className="text-white text-lg font-bold">Education</h3>

                  <p className="text-3xl font-bold text-white mt-2">
                    {breakdown.education}%
                  </p>
                </div>
              </div>

              <div className="mt-8 bg-slate-800 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-4">
                  💪 Resume Strength
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <p className="text-3xl">🎯</p>
                    <p className="text-white font-bold mt-2">
                      {breakdown.skills}%
                    </p>
                    <p className="text-gray-400 text-sm">Skills</p>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <p className="text-3xl">📂</p>
                    <p className="text-white font-bold mt-2">
                      {breakdown.projects}%
                    </p>
                    <p className="text-gray-400 text-sm">Projects</p>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <p className="text-3xl">💼</p>
                    <p className="text-white font-bold mt-2">
                      {breakdown.experience}%
                    </p>
                    <p className="text-gray-400 text-sm">Experience</p>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <p className="text-3xl">🎓</p>
                    <p className="text-white font-bold mt-2">
                      {breakdown.education}%
                    </p>
                    <p className="text-gray-400 text-sm">Education</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-center shadow-lg">
                <h3 className="text-white text-xl font-bold">
                  Overall Resume Rating
                </h3>

                <p className="text-4xl mt-2">{rating.icon}</p>

                <h2 className="text-3xl font-bold text-white mt-2">
                  {rating.title}
                </h2>

                <p className="text-indigo-100 mt-2">
                  Your resume is suitable for {result.job_role}.
                </p>
              </div>

              <div className="flex justify-center mt-4">
                <span
                  className={`${rating.color} text-white px-5 py-2 rounded-full font-bold shadow-lg`}
                >
                  {rating.icon} {rating.title}
                </span>
              </div>

              <div className="flex flex-col items-center mt-6">
                <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg
                    className="-rotate-90"
                    width="200"
                    height="200"
                    viewBox="0 0 200 200"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke="#334155"
                      strokeWidth="10"
                      fill="none"
                    />

                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke={scoreColor}
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray="502.4"
                      strokeDashoffset={
                        502.4 - (502.4 * result.ats_score) / 100
                      }
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-in-out"
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="absolute inset-0 flex items-center justify-center text-5xl font-bold"
                      style={{ color: scoreColor }}
                    >
                      {animatedScore}%
                    </div>
                  </div>
                </div>
                <p
                  className="mt-4 text-center text-xl font-semibold"
                  style={{ color: scoreColor }}
                >
                  <span>
                    {scoreLabel}
                    <br />
                    <span className="text-sm text-gray-400">
                      ATS Compatibility Score
                    </span>
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8">
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400">Role</p>

                  <h3 className="text-blue-400 font-bold">{result.job_role}</h3>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400">Matched</p>

                  <h3 className="text-green-400 font-bold">
                    {result?.summary?.matched}
                  </h3>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400">Missing</p>

                  <h3 className="text-red-400 font-bold">
                    {result?.summary?.missing}
                  </h3>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <p className="text-gray-400">Resume Score</p>

                  <h3 className="text-cyan-400 font-bold">
                    {result.ats_score}%
                  </h3>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4">
                  📊 ATS Score Breakdown
                </h3>

                {[
                  { label: "Skills", value: breakdown.skills },
                  { label: "Projects", value: breakdown.projects },
                  { label: "Experience", value: breakdown.experience },
                  { label: "Education", value: breakdown.education },
                  { label: "Formatting", value: breakdown.formatting },
                ].map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between text-white mb-1">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-slate-800 rounded-xl p-5">
                <h3 className="text-xl font-bold text-white mb-4">
                  📋 Resume Analysis
                </h3>

                <div className="space-y-3">
                  {analysis.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-700 rounded-lg px-4 py-3"
                    >
                      <span className="text-white">{item.title}</span>

                      <span
                        className={`font-bold ${
                          item.status ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {item.status ? "✔ Good" : "✖ Needs Work"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-400" />
                <h3 className="text-xl font-semibold text-green-400">
                  Matched Skills
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {result?.matched_skills?.length > 0 ? (
                  result?.matched_skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-cyan-600 rounded-lg p-3 text-center text-white font-semibold shadow-lg hover:-translate-y-1 transition"
                    >
                      🔑 {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-green-400">No matched skills found</p>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <XCircle className="text-red-400" />
                <h3 className="text-xl font-semibold text-red-400">
                  Missing Skills
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {result?.missing_skills?.length > 0 ? (
                  result?.missing_skills?.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-red-600 rounded-lg p-3 text-center text-white font-semibold hover:-translate-y-1 transition duration-300 shadow-lg"
                    >
                      {skill}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No missing skills found</p>
                )}
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-cyan-400" />

                  <h3 className="text-xl font-semibold text-cyan-400">
                    Detected Resume Keywords
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.matched_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-cyan-600 text-white px-3 py-2 rounded-full text-sm font-semibold shadow"
                    >
                      🔑 {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold text-white mb-6">
                  📊 Resume Analytics
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Pie Chart */}

                  <div className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700 hover:border-blue-500 transition-all duration-300">
                    <h3 className="text-white font-bold mb-4 text-center">
                      Skills Distribution
                    </h3>

                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          isAnimationActive
                          animationDuration={1500}
                          data={pieData}
                          dataKey="value"
                          outerRadius={90}
                          label
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index]} />
                          ))}
                        </Pie>

                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar Chart */}

                  <div className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700 hover:border-blue-500 transition-all duration-300">
                    <h3 className="text-white font-bold mb-4 text-center">
                      ATS Breakdown
                    </h3>

                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="name" />

                        <YAxis />

                        <Tooltip />

                        <Bar
                          animationDuration={1800}
                          dataKey="score"
                          fill="#3b82f6"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-yellow-400" />
                  <h3 className="text-xl font-semibold text-yellow-400">
                    AI Suggestions
                  </h3>
                </div>

                <div className="space-y-4">
                  {result.suggestions?.length > 0 ? (
                    result.suggestions.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-yellow-400 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center">
                          {index + 1}
                        </div>

                        <div>
                          <h4 className="text-yellow-400 font-semibold">
                            Suggestion {index + 1}
                          </h4>

                          <p className="text-gray-300 mt-1">{item}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-green-400">No Suggestions</p>
                  )}
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-white">
                  🎯 Final Recommendation
                </h2>

                <p className="text-white mt-4 text-lg">
                  {result.ats_score >= 80
                    ? "Excellent! Your resume is highly ATS-friendly and ready for applications."
                    : result.ats_score >= 60
                      ? "Good resume. Add the missing skills and improve formatting for a better ATS score."
                      : "Your resume needs significant improvement before applying for jobs."}
                </p>
              </div>

              <div className="mt-8 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-center">
                <h2 className="text-2xl text-white font-bold">
                  🎯 Interview Chances
                </h2>

                <p className="text-5xl mt-4">
                  {result.ats_score >= 85
                    ? "95%"
                    : result.ats_score >= 70
                      ? "80%"
                      : result.ats_score >= 50
                        ? "60%"
                        : "35%"}
                </p>

                <p className="text-green-100 mt-3">
                  Estimated chance of passing ATS screening.
                </p>
              </div>
            </div>
          </div>
        )}
        <footer className="mt-12 border-t border-slate-700 pt-6 text-center">
          <p className="text-gray-400">
            Made with ❤️ using React + Django + AI
          </p>

          <p className="text-gray-500 text-sm mt-2">
            AI Resume Analyzer © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
