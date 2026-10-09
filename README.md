import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import { Menu, Trash2, Plus, Save, Printer, MessageCircle, FileText, Download, Table, Copy, Lightbulb, X, Send, AlertTriangle, CheckCircle, Eye, RefreshCw, Edit, Cloud, CloudOff, Wifi, Scissors, ChevronDown, RefreshCcw, Database, Search, UserCheck, DollarSign, Calendar, CreditCard, CheckSquare, XCircle, Upload, Clock, Filter, Languages, Maximize2, Minimize2, FileBarChart, BarChart, BookOpen, Users, Book, LayoutDashboard, Moon, HardDrive, Package, List, StickyNote, BellRing, Wallet, Receipt, ArrowDownRight, ArrowUpRight } from 'lucide-react';

// --- LOCAL STORAGE DB POLYFILLS (Replacing Firebase) ---
const localDB = {
    get: (col) => {
        try { return JSON.parse(localStorage.getItem(col) || '[]'); } 
        catch { return []; }
    },
    add: (col, data) => {
        const list = localDB.get(col);
        const newItem = { id: Date.now().toString(36) + Math.random().toString(36).substr(2), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        list.push(newItem);
        localStorage.setItem(col, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('db_changed', { detail: col }));
        return newItem;
    },
    update: (col, id, data) => {
        const list = localDB.get(col);
        const idx = list.findIndex(i => i.id === id);
        if (idx > -1) {
            let newData = { ...data };
            if (newData.stock && typeof newData.stock === 'object' && newData.stock.__isIncrement) {
                newData.stock = Number(list[idx].stock || 0) + newData.stock.val;
            }
            list[idx] = { ...list[idx], ...newData, updatedAt: new Date().toISOString() };
            localStorage.setItem(col, JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('db_changed', { detail: col }));
        }
    },
    delete: (col, id) => {
        const list = localDB.get(col);
        const filtered = list.filter(i => i.id !== id);
        localStorage.setItem(col, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('db_changed', { detail: col }));
    }
};

const serverTimestamp = () => new Date().toISOString();
const increment = (val) => ({ __isIncrement: true, val });
const collection = (...args) => args[args.length - 1]; 
const doc = (...args) => ({ collection: args[args.length - 2], id: args[args.length - 1] });
const addDoc = async (colName, data) => Promise.resolve(localDB.add(colName, data));
const updateDoc = async (docRef, data) => Promise.resolve(localDB.update(docRef.collection, docRef.id, data));
const deleteDoc = async (docRef) => Promise.resolve(localDB.delete(docRef.collection, docRef.id));

const db = null;
const appId = 'local-app';

// --- GOOGLE APPS SCRIPT CONFIGURATION ---
const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzfSRDQQWBZ8WYk7nSpNjGCc7fHsgd3qgMnPZW3tKRtoLUURqebfXbCCnwDOd-pspI/exec';

// --- COMPANY LOGO ---
const COMPANY_LOGO_URL = 'https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png';

// API Key (for LLM analysis)
const apiKey = ""; 
const API_MODEL = 'gemini-2.5-flash-preview-09-2025';
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${apiKey}`;

// --- UTILITY FUNCTIONS ---
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 403) throw new Error(`Gemini API Error: Access Denied (Status 403).`);
            if (!response.ok) {
                if (response.status === 429 && i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                    continue;
                }
                throw new Error(`Gemini API HTTP Error: status ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
};

// --- NUMBER TO WORDS (For Tally Bill) ---
const convertNumberToWords = (amount) => {
    const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const numToWords = (num) => {
        if (num < 20) return words[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + words[num % 10] : "");
        if (num < 1000) return words[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numToWords(num % 100) : "");
        if (num < 100000) return numToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numToWords(num % 1000) : "");
        if (num < 10000000) return numToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numToWords(num % 100000) : "");
        return numToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + numToWords(num % 10000000) : "");
    };

    const rupees = Math.floor(amount);
    if (rupees === 0) return "Zero";
    return numToWords(rupees);
};

const getDayOfWeek = (dateString, lang) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const daysGuj = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'];
    const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return lang === 'Gujarati' ? daysGuj[d.getDay()] : daysEng[d.getDay()];
};

const isChutni = (text) => text && typeof text === 'string' && text.toLowerCase().includes('chutni');

// --- STATUS PROGRESS MAPPER ---
const getStatusProgress = (status) => {
    const s = status || '';
    if (s.includes('Cancel')) return { percent: 100, color: 'bg-rose-500' };
    if (s.includes('Placed')) return { percent: 15, color: 'bg-blue-500' };
    if (s.includes('Design') || s.includes('Proof') || s.includes('Typing')) return { percent: 40, color: 'bg-indigo-500' };
    if (s.includes('Printing') || s.includes('Working')) return { percent: 70, color: 'bg-fuchsia-500' };
    if (s.includes('Ready') || s.includes('Collect')) return { percent: 90, color: 'bg-amber-500' };
    if (s.includes('Delivered') || s.includes('Pakku') || s.includes('Tally') || s.includes('Part')) return { percent: 100, color: 'bg-emerald-500' };
    return { percent: 0, color: 'bg-slate-200' };
};

// Function to load html2pdf library dynamically (For AUTO PDF DOWNLOAD)
const loadHtml2Pdf = () => {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve(window.html2pdf);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Function to load html2canvas library dynamically (For JPG Export)
const loadHtml2Canvas = () => {
  return new Promise((resolve) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    document.head.appendChild(script);
  });
};

// Function to load JSZip library dynamically (For ZIP Folder Export)
const loadJSZip = () => {
  return new Promise((resolve) => {
    if (window.JSZip) return resolve(window.JSZip);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve(window.JSZip);
    document.head.appendChild(script);
  });
};

// Function to load XLSX library dynamically (For IMPORTING)
const loadXLSX = () => {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Function to load XlsxPopulate library dynamically (For EXPORTING with PASSWORD & STYLING)
const loadXlsxPopulate = () => {
  return new Promise((resolve, reject) => {
    if (window.XlsxPopulate) {
      resolve(window.XlsxPopulate);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx-populate/1.21.0/xlsx-populate.min.js';
    script.onload = () => resolve(window.XlsxPopulate);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Function to Format Timestamp for Last Edit
const formatLastEditTime = (timestamp) => {
    if (!timestamp) return '';
    const d = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

// Function to Format Date as DDMMYYYY for Excel
const formatDateForExcel = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}${month}${year}`;
};

// Function to Formate Date and Time for strict sorting
const parseDateTime = (dateStr, timeStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    if (timeStr) {
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
            let hrs = parseInt(match[1], 10);
            const mins = parseInt(match[2], 10);
            const isPM = match[3] && match[3].toUpperCase() === 'PM';
            if (isPM && hrs < 12) hrs += 12;
            if (!isPM && hrs === 12 && match[3]) hrs = 0;
            d.setHours(hrs, mins, 0, 0);
        }
    }
    return d.getTime();
};

// Function to calculate future date for quick selection
const getFutureDateStr = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
};

// --- AUTO-FILL SUGGESTIONS ---
const itemSuggestions = {
    'Bill Book': [
        '100+100 belarpur & ABC yellow',
        '50+50+50 belarpur & ABC yellow & pink',
        'kachu bainding',
        'paku bainding'
    ],
    'Visiting Card': [
        'matt uv card',
        'non tarebale card',
        'matt card',
        'gold foil card'
    ],
    'Invitation Card': [
        '8.5X5.5 multi card',
        'kankotri No.',
        'uv kankotri'
    ],
    'Kankotri': [
        'kankotri No.',
    ],
    'Selfink Stamp': [
        'Blue Ink', 
        'Black Ink', 
        'Red Ink', 
        'Green Ink', 
        'Violet Ink',
        'Round Stamp',
        'Date Stamp'
    ],
    'Rubber Stamp': [
        'Proprietor Stamp',
        'Address Stamp',
        'Signature Stamp',
        'Round Stamp',
        'Bank Stamp'
    ]
};

// --- STAFF LISTS ---
const operators = ['Murtazabhai', 'Sunilbhai', 'Kiranbhai', 'Mahirbhai', 'Admin'];
const designers = ['Murtuzabhai', 'Sunilbhai', 'Umeshbhai', 'Kiranbhai']; 
const printingVendors = ['SELF', 'PARESH', 'DILPESH', 'SHAMA SCREEN', 'CAMBAY', 'SHAHJI', 'CYBERA', 'PAPER STORE']; 
const paymentModes = ['CASH', 'GPAY', 'CHEQUE', 'BANK TRANSFER', 'DISCOUNT', 'TALLY ENTRY'];

// NEW: Delivery Persons List (Delivery Karnara)
const deliveryPersons = ['Murtaza', 'Sunil', 'Kiran', 'Babu', 'Aarifbhai'];

const statuses = [
    'Order Placed Successfully', 
    'In Design', 
    'Proof Send WhatsApp',
    'Proof Party Lai gaya', 
    'Proof Ok',
    'Rubber Stamp In Typing', 
    'In Printing', 
    'In Working', 
    'Job Pending',
    'Job Ready', 
    'Job Collect Remaining', 
    'Part Delivery', 
    'Delivered', 
    'Delivered but Not Sure',
    'Pakku Bill',
    'Tally Entry',
    'Order Cancel'
];

const pressItems = [
    'Bill Book', 'Letterpad', 'Visiting Card', 'Selfink Stamp', 'Rubber Stamp',
    'Pamphlet', 'Sticker', 'Wedding Card', 'Envelope', 'File Folder',
    'Banner / Flex', 'Invitation Card', 'Binding Work', 'Lamination', 'Design Charge'
];

const StatusDashboardModal = ({ onClose, currentJobs, allJobs, onViewEstimate, onSaveAllAsPDF, isAutoDownloading, onSaveAsJpgZip, isJpgGenerating }) => {
    const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);

    const columns = [
        {
            title: '🆕 નવા ઓર્ડર (New)',
            color: 'bg-blue-100 text-blue-800 border-blue-300',
            cardColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            statuses: ['Order Placed Successfully']
        },
        {
            title: '🎨 ડિઝાઇન / પ્રૂફ (Design/Proof)',
            color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
            cardColor: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
            statuses: ['In Design', 'Proof Send WhatsApp', 'Proof Party Lai gaya', 'Proof Ok']
        },
        {
            title: '🖨️ પ્રિન્ટિંગ (Printing/Working)',
            color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
            cardColor: 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100',
            statuses: ['In Printing', 'In Working', 'Rubber Stamp In Typing']
        },
        {
            title: '✅ તૈયાર (Ready/Collect)',
            color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            cardColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
            statuses: ['Job Ready', 'Job Collect Remaining', 'Part Delivery']
        },
        {
            title: '⏳ પેન્ડિંગ (Pending)',
            color: 'bg-orange-100 text-orange-800 border-orange-300',
            cardColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
            statuses: ['Job Pending']
        },
        {
            title: '⚠️ બાકી રકમ (Outstanding)',
            color: 'bg-rose-100 text-rose-800 border-rose-300',
            cardColor: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
            isOutstanding: true
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl flex flex-col h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-teal-700 text-white rounded-t-xl shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><LayoutDashboard className="w-6 h-6"/> સ્ટેટસ ડેશબોર્ડ (Status Dashboard)</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-teal-800/50 px-2 py-1 rounded-lg">
                            <span className="text-xs font-bold">તારીખ:</span>
                            <input 
                                type="date" 
                                value={exportDate} 
                                onChange={e => setExportDate(e.target.value)} 
                                className="text-slate-800 text-xs px-2 py-1 rounded outline-none font-bold" 
                            />
                        </div>
                        <button onClick={() => onSaveAsJpgZip(exportDate)} disabled={isAutoDownloading || isJpgGenerating} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow transition-colors disabled:opacity-50" title="પસંદ કરેલ તારીખના એસ્ટિમેટ JPG ફોલ્ડર તરીકે ડાઉનલોડ કરો">
                            <Download className="w-4 h-4"/> {isJpgGenerating ? "ZIP..." : "SAVE AS JPG"}
                        </button>
                        <span className="bg-teal-800 px-3 py-1 rounded-full text-xs font-bold shadow-inner border border-teal-600 ml-1">Active: {currentJobs.length}</span>
                        <button onClick={onClose} className="p-1 hover:bg-teal-600 rounded-full transition-colors ml-1"><X className="w-5 h-5 text-white" /></button>
                    </div>
                </div>

                <div className="flex-grow overflow-x-auto overflow-y-hidden p-4 bg-slate-100">
                    <div className="flex gap-4 h-full min-w-max">
                        {columns.map(col => {
                            const colJobs = col.isOutstanding 
                                ? allJobs.filter(j => Number(j.outstanding) > 0 && j.status !== 'Order Cancel').sort((a,b) => new Date(a.date) - new Date(b.date))
                                : currentJobs.filter(j => col.statuses?.includes(j.status)).sort((a,b) => new Date(a.date) - new Date(b.date));
                            
                            return (
                                <div key={col.title} className={`flex-1 min-w-[280px] rounded-xl border flex flex-col bg-white shadow-sm overflow-hidden ${col.color}`}>
                                    <div className={`p-3 font-bold text-sm flex justify-between items-center bg-white/40 border-b`}>
                                        <span>{col.title}</span>
                                        <span className="bg-white/70 px-2 py-0.5 rounded-full text-xs shadow-sm">{colJobs.length}</span>
                                    </div>
                                    <div className="flex-grow overflow-y-auto p-3 space-y-3 bg-white/30">
                                        {colJobs.length === 0 ? (
                                            <div className="text-center text-slate-400 italic text-xs py-4">કોઈ જોબ નથી</div>
                                        ) : (
                                            colJobs.map(job => (
                                                <div 
                                                    key={job.id} 
                                                    onClick={() => { onClose(); onViewEstimate(job); }}
                                                    className={`p-3 rounded-lg border shadow-sm cursor-pointer transition-transform hover:scale-[1.02] ${col.cardColor}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold font-mono text-xs text-slate-700 bg-white/70 px-1.5 py-0.5 rounded">{job.estNo}</span>
                                                        <span className="text-[10px] font-bold text-slate-500">{job.date ? new Date(job.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}) : ''}</span>
                                                    </div>
                                                    <div className="font-bold text-sm text-slate-800 mb-1 leading-tight truncate" title={job.customerName}>{job.customerName}</div>
                                                    <div className="text-xs text-slate-600 mb-2 truncate" title={job.items?.[0]?.particular}>
                                                        <span className={isChutni(job.items?.[0]?.particular) ? 'bg-pink-100 text-pink-800 font-bold px-1 rounded border border-pink-300' : ''}>
                                                            {isChutni(job.items?.[0]?.particular) ? '🌶️ ' : ''}{job.items?.[0]?.particular}
                                                        </span> 
                                                        {job.items?.length > 1 ? ` (+${job.items.length - 1} વધુ)` : ''}
                                                    </div>
                                                    
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/10">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/60 text-slate-700 truncate max-w-[120px]" title={job.status}>{job.status}</span>
                                                        <div className="flex items-center gap-1">
                                                            {Number(job.outstanding) > 0 && (
                                                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-200">બાકી: ₹{job.outstanding}</span>
                                                            )}
                                                            {(job.designerName && col.statuses?.includes('In Design')) ? (
                                                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/50 px-1.5 rounded">{job.designerName}</span>
                                                            ) : (job.printingVendor && col.statuses?.includes('In Printing')) ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[9px] font-bold text-fuchsia-700 bg-fuchsia-100/50 px-1.5 rounded">{job.printingVendor}</span>
                                                                    {job.inPrintingDate && <span className="text-[8px] font-bold text-fuchsia-600 mt-0.5">{job.inPrintingDate}</span>}
                                                                </div>
                                                            ) : (col.statuses?.includes('Job Ready') && job.jobReadyDate) ? (
                                                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded border border-emerald-200">{job.jobReadyDate}</span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW: GLOBAL SEARCH MODAL ---
const GlobalSearchModal = ({ onClose, history, onViewEstimate, onEditEstimate, isChutni }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);

    const filteredJobs = useMemo(() => {
        if (!deferredSearchTerm.trim()) return []; 
        const term = deferredSearchTerm.toLowerCase();
        return history.filter(row => {
            const customerMatch = row.customerName?.toLowerCase().includes(term);
            const estNoMatch = row.estNo?.toLowerCase().includes(term);
            const phoneMatch = row.phone?.includes(term);
            const amountMatch = String(row.totalAmount || '').includes(term);
            return customerMatch || estNoMatch || phoneMatch || amountMatch;
        }).slice(0, 50); // Limit to 50 results for performance
    }, [history, deferredSearchTerm]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-700 p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Search className="w-6 h-6"/> બધા ઓર્ડર શોધો (Global Search)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ગ્રાહકનું નામ, Est. No, મોબાઈલ નંબર અથવા રકમ (Amount) લખો..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-indigo-300 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-lg text-indigo-900 shadow-sm"
                            autoFocus
                        />
                        <Search className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400"/>
                        {searchTerm && <X className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-indigo-400 cursor-pointer hover:text-indigo-700" onClick={() => setSearchTerm('')}/>}
                    </div>
                    <p className="text-xs text-indigo-600 mt-2 font-medium px-1">નોંધ: અહીંથી તમે Active અને Delivered બંને પ્રકારના ઓર્ડર એકસાથે શોધી શકો છો.</p>
                </div>

                <div className="flex-grow overflow-y-auto bg-slate-100 p-4">
                    {!deferredSearchTerm.trim() ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                            <Search className="w-16 h-16 mb-4"/>
                            <p className="text-xl font-bold">ઓર્ડર શોધવા માટે ઉપર ટાઈપ કરો</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <AlertTriangle className="w-12 h-12 mb-4 text-amber-400"/>
                            <p className="text-lg font-bold">કોઈ ઓર્ડર મળ્યો નથી.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="min-w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-3">No.</th>
                                        <th className="px-3 py-3">તારીખ</th>
                                        <th className="px-3 py-3">ગ્રાહક</th>
                                        <th className="px-3 py-3">આઈટમ</th>
                                        <th className="px-3 py-3 text-right">Total</th>
                                        <th className="px-3 py-3 text-center">Status</th>
                                        <th className="px-3 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredJobs.map((row) => {
                                        const isDelivered = row.status === 'Delivered' || row.status === 'Pakku Bill';
                                        return (
                                        <tr key={row.id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-3 py-2.5 font-mono font-bold text-xs text-indigo-600">{row.estNo}</td> 
                                            <td className="px-3 py-2.5 text-[11px] whitespace-nowrap text-slate-500">{row.date ? new Date(row.date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: '2-digit'}) : 'N/A'}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="font-bold text-slate-800 text-sm leading-tight">{row.customerName}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.phone}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-slate-600 truncate max-w-[200px]" title={row.items?.map(i => i.particular).join(', ')}>
                                                {row.items?.map((i, idx) => (
                                                    <span key={idx} className={isChutni(i.particular) ? 'bg-pink-100 text-pink-800 font-bold px-1 rounded border border-pink-200 mr-1' : 'mr-1'}>
                                                        {isChutni(i.particular) ? '🌶️ ' : ''}{i.particular}{idx < row.items.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="font-bold text-slate-700">₹{Number(row.totalAmount).toFixed(0)}</div>
                                                {Number(row.outstanding) > 0 ? (
                                                    <div className="text-[10px] font-bold text-rose-600 mt-0.5">બાકી: ₹{Number(row.outstanding).toFixed(0)}</div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-emerald-600 mt-0.5">જમા: ₹{Number(row.advance).toFixed(0)}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${isDelivered ? 'bg-emerald-100 text-emerald-700' : row.status === 'Order Cancel' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <div className="flex justify-center gap-1.5">
                                                    <button onClick={() => onViewEstimate(row)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors" title="View"><Eye className="w-4 h-4"/></button>
                                                    <button onClick={() => { onEditEstimate(null, row); onClose(); }} className="p-1.5 bg-sky-50 text-sky-600 rounded hover:bg-sky-100 transition-colors" title="Edit / Load in Main Screen"><Edit className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- KANKOTRI INVENTORY MODAL ---
const KankotriInventoryModal = ({ onClose, inventory, db, appId, history }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [newItemNo, setNewItemNo] = useState('');
    const [newItemStock, setNewItemStock] = useState('');
    
    const [editingId, setEditingId] = useState(null);
    const [editStock, setEditStock] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const filteredInventory = inventory
        .filter(item => item.kankotriNo?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a,b) => a.kankotriNo?.localeCompare(b.kankotriNo));

    const handleAdd = async () => {
        if (!newItemNo.trim()) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'kankotri_inventory'), {
                kankotriNo: newItemNo.toUpperCase(),
                stock: Number(newItemStock) || 0,
                updatedAt: serverTimestamp()
            });
            setNewItemNo(''); setNewItemStock('');
        } catch (err) { console.error("Error adding inventory:", err); }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditStock(item.stock);
    };

    const handleUpdate = async (id) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kankotri_inventory', id), {
                stock: Number(editStock) || 0,
                updatedAt: serverTimestamp()
            });
            setEditingId(null);
        } catch (err) { console.error("Error updating inventory:", err); }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kankotri_inventory', id));
        } catch (err) { console.error("Error deleting inventory:", err); }
    };

    const getUsageHistory = (kankotriNo) => {
        if (!kankotriNo) return [];
        const no = kankotriNo.toUpperCase();
        
        let usage = [];
        (history || []).forEach(est => {
            if (est.status === 'Order Cancel') return; 
            
            est.items?.forEach(item => {
                const textToSearch = `${item.particular || ''} ${item.detail || ''}`.toUpperCase();
                const escaped = no.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escaped}($|\\s|[^a-zA-Z0-9])`);
                
                if (regex.test(textToSearch)) {
                    usage.push({
                        id: est.id + item.id,
                        estNo: est.estNo,
                        date: est.date,
                        customerName: est.customerName,
                        phone: est.phone,
                        detail: `${item.particular} ${item.detail ? '- ' + item.detail : ''}`,
                        qty: Number(item.qty) || 0,
                        status: est.status
                    });
                }
            });
        });
        
        return usage.sort((a,b) => new Date(b.date) - new Date(a.date));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden">
                <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Package className="w-6 h-6"/> કંકોત્રી સ્ટોક રજીસ્ટર (Kankotri Inventory)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-4 bg-pink-50 border-b border-pink-100 shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label className="text-xs font-bold text-pink-800 uppercase">Kankotri No.</label>
                        <input type="text" value={newItemNo} onChange={e => setNewItemNo(e.target.value)} placeholder="દા.ત. K-101" className="w-full border border-pink-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-pink-500 outline-none uppercase" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-pink-800 uppercase">Stock (સ્ટોક)</label>
                        <input type="number" value={newItemStock} onChange={e => setNewItemStock(e.target.value)} placeholder="0" className="w-full border border-pink-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-pink-500 outline-none" />
                    </div>
                    <button onClick={handleAdd} disabled={!newItemNo} className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        <Plus className="w-5 h-5"/> ઉમેરો
                    </button>
                </div>

                <div className="p-3 bg-white border-b shrink-0">
                     <div className="relative">
                        <input type="text" placeholder="સર્ચ કરો કંકોત્રી નંબર..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-slate-50 font-bold text-slate-700"/>
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                        {searchTerm && <X className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setSearchTerm('')}/>}
                     </div>
                </div>

                <div className="flex-grow overflow-y-auto bg-slate-100 p-4">
                    <table className="min-w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-sm">
                        <thead className="bg-slate-200 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-300">
                            <tr>
                                <th className="px-4 py-3 text-left">No.</th>
                                <th className="px-4 py-3 text-left">Kankotri No.</th>
                                <th className="px-4 py-3 text-right">Stock (સ્ટોક)</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInventory.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-slate-400 italic font-medium">કોઈ કંકોત્રી નો રેકોર્ડ મળ્યો નથી.</td></tr>
                            ) : (
                                filteredInventory.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                    <tr className={`hover:bg-pink-50/50 transition-colors ${expandedId === item.id ? 'bg-pink-50' : ''}`}>
                                        <td className="px-4 py-2.5 text-slate-500 font-medium">{index + 1}</td>
                                        <td className="px-4 py-2.5 font-bold text-pink-700 text-base">{item.kankotriNo}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            {editingId === item.id ? (
                                                <input type="number" value={editStock} onChange={e=>setEditStock(e.target.value)} className="w-20 border-2 border-pink-400 rounded px-2 py-1 text-right outline-none font-bold focus:ring-2 focus:ring-pink-200"/>
                                            ) : (
                                                <span className={`font-extrabold text-base bg-slate-100 px-3 py-1 rounded-lg border ${item.stock <= 50 ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-slate-700 border-slate-200'}`}>{item.stock}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center flex justify-center gap-2">
                                            <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className={`p-2 rounded-lg shadow-sm transition-colors ${expandedId === item.id ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`} title="View Usage Details"><List className="w-4 h-4"/></button>
                                            {editingId === item.id ? (
                                                <button onClick={() => handleUpdate(item.id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 shadow-sm" title="Save"><Save className="w-4 h-4"/></button>
                                            ) : (
                                                <button onClick={() => startEdit(item)} className="p-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 shadow-sm" title="Edit"><Edit className="w-4 h-4"/></button>
                                            )}
                                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 shadow-sm" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                    {expandedId === item.id && (
                                        <tr>
                                            <td colSpan="4" className="bg-indigo-50/50 p-4 border-b border-indigo-100">
                                                <div className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
                                                    <div className="bg-indigo-100/80 px-4 py-2 text-indigo-900 font-bold text-xs flex justify-between items-center border-b border-indigo-200">
                                                        <span className="flex items-center gap-2"><List className="w-3.5 h-3.5"/> {item.kankotriNo} - વપરાશ વિગત (Usage Details)</span>
                                                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full">કુલ વપરાયેલ (Total Used): {getUsageHistory(item.kankotriNo).reduce((sum, u) => sum + u.qty, 0)}</span>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        <table className="w-full text-[11px] text-left">
                                                            <thead className="bg-slate-50 border-b text-slate-500 sticky top-0">
                                                                <tr>
                                                                    <th className="px-3 py-2">Date</th>
                                                                    <th className="px-3 py-2">Est No</th>
                                                                    <th className="px-3 py-2">Party (ગ્રાહક)</th>
                                                                    <th className="px-3 py-2">Mobile Number</th>
                                                                    <th className="px-3 py-2">Color / Details</th>
                                                                    <th className="px-3 py-2 text-right">Qty Used</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {getUsageHistory(item.kankotriNo).length === 0 ? (
                                                                    <tr><td colSpan="6" className="px-3 py-6 text-center text-slate-400 italic">આ કંકોત્રીનો હજુ કોઈ ઓર્ડરમાં ઉપયોગ થયો નથી.</td></tr>
                                                                ) : (
                                                                    getUsageHistory(item.kankotriNo).map((u, i) => (
                                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                            <td className="px-3 py-2 text-slate-500 font-medium">{new Date(u.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'2-digit'})}</td>
                                                                            <td className="px-3 py-2 font-mono font-bold text-indigo-600">{u.estNo}</td>
                                                                            <td className="px-3 py-2 font-bold text-slate-700">{u.customerName}</td>
                                                                            <td className="px-3 py-2 text-slate-500 font-mono">{u.phone || '-'}</td>
                                                                            <td className="px-3 py-2 text-slate-500 truncate max-w-[150px]" title={u.detail}>{u.detail}</td>
                                                                            <td className="px-3 py-2 text-right font-extrabold text-rose-600">- {u.qty}</td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// DAILY EXPENSE MODAL (NEW FEATURE)
// ============================================================================
const DailyExpenseModal = ({ onClose, db, appId, user, expenses, operatorName }) => {
    const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
    const [expCategory, setExpCategory] = useState('ચા-નાસ્તો (Tea/Snacks)');
    const [expAmount, setExpAmount] = useState('');
    const [expDetail, setExpDetail] = useState('');
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [isSaving, setIsSaving] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    // NEW STATES FOR ADVANCED EXPENSE FEATURES
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [editingExp, setEditingExp] = useState(null);
    const [showCategorySummary, setShowCategorySummary] = useState(false);

    const baseCategories = [
        'ચા-નાસ્તો (Tea/Snacks)',
        'કારીગર ખર્ચ / એડવાન્સ (Staff Petty Cash)',
        'ટિફિન / જમવાનું (Tiffin/Meals)',
        'દુકાનનો સામાન (Shop Material)',
        'પેટ્રોલ / ભાડું (Fuel/Travel)',
        'અન્ય પરચુરણ (Other)'
    ];

    // Combine base categories with existing custom categories from db
    const allCategories = Array.from(new Set([...baseCategories, ...expenses.map(e => e.category)])).filter(Boolean);
    const isAdmin = operatorName === 'Admin';

    const filteredExpenses = expenses
        .filter(e => e.date.startsWith(monthFilter))
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

    // Calculate Category-wise Totals
    const categoryTotals = {};
    filteredExpenses.forEach(e => {
        const cat = e.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
    });
    const sortedCategoryTotals = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);

    // NEW: Petty Cash Logic (આપેલ પેટી કેશ - થયેલ ખર્ચ = બાકી)
    const monthPettyCashGiven = filteredExpenses.filter(e => e.category === 'કારીગર ખર્ચ / એડવાન્સ (Staff Petty Cash)' || e.category?.includes('કારીગર')).reduce((sum, e) => sum + Number(e.amount), 0);
    const monthOtherExpenses = filteredExpenses.filter(e => e.category !== 'કારીગર ખર્ચ / એડવાન્સ (Staff Petty Cash)' && !e.category?.includes('કારીગર')).reduce((sum, e) => sum + Number(e.amount), 0);
    const monthBalance = monthPettyCashGiven - monthOtherExpenses;

    const handleAddExpense = async () => {
        if (!expAmount || isNaN(Number(expAmount)) || Number(expAmount) <= 0) {
            alert('કૃપા કરીને સાચી રકમ નાખો.');
            return;
        }
        const finalCategory = expCategory.trim() || 'Other';
        setIsSaving(true);
        try {
            if (editingExp) {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'daily_expenses', editingExp.id), {
                    date: expDate,
                    category: finalCategory,
                    amount: Number(expAmount),
                    description: expDetail.trim(),
                    updatedAt: serverTimestamp()
                });
                setEditingExp(null);
            } else {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_expenses'), {
                    date: expDate,
                    category: finalCategory,
                    amount: Number(expAmount),
                    description: expDetail.trim(),
                    userId: user?.uid || 'unknown',
                    createdAt: serverTimestamp()
                });
            }
            setExpAmount('');
            setExpDetail('');
            if (isAddingCategory) setIsAddingCategory(false);
        } catch (err) {
            alert('ખર્ચ સેવ કરવામાં ભૂલ થઈ.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (exp) => {
        setExpDate(exp.date);
        setExpCategory(exp.category);
        if (!allCategories.includes(exp.category)) setIsAddingCategory(true);
        else setIsAddingCategory(false);
        setExpAmount(exp.amount);
        setExpDetail(exp.description || '');
        setEditingExp(exp);
    };

    const cancelEdit = () => {
        setEditingExp(null);
        setExpAmount('');
        setExpDetail('');
        setExpCategory(baseCategories[0]);
        setIsAddingCategory(false);
    };

    const confirmDelete = (exp) => {
        setExpenseToDelete(exp);
    };

    const executeDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'daily_expenses', expenseToDelete.id));
            setExpenseToDelete(null);
        } catch (err) {
            console.error("Delete error", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Wallet className="w-6 h-6"/> દૈનિક ખર્ચ રજીસ્ટર (Daily Expenses)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-4 bg-rose-50 border-b border-rose-200 shrink-0 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                        <label className="text-xs font-bold text-rose-800 uppercase">તારીખ (Date)</label>
                        <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full border border-rose-300 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-rose-800 uppercase">કેટેગરી (Category)</label>
                        {isAddingCategory ? (
                            <div className="flex gap-1 items-center">
                                <input type="text" value={expCategory} onChange={e => setExpCategory(e.target.value)} placeholder="નવી કેટેગરી..." className="w-full border border-rose-300 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-rose-500" autoFocus />
                                <button onClick={() => { setIsAddingCategory(false); setExpCategory(baseCategories[0]); }} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200" title="Cancel"><X className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <select value={expCategory} onChange={e => {
                                if(e.target.value === 'ADD_NEW') { setIsAddingCategory(true); setExpCategory(''); }
                                else setExpCategory(e.target.value);
                            }} className="w-full border border-rose-300 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="ADD_NEW" className="font-bold text-indigo-600 bg-indigo-50">+ નવી કેટેગરી ઉમેરો (Add New)...</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-rose-800 uppercase">રકમ (Amount - ₹)</label>
                        <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0" className="w-full border border-rose-300 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                    <div className="md:col-span-4 flex gap-3 mt-2">
                        <div className="flex-grow">
                            <label className="text-xs font-bold text-rose-800 uppercase">વિગત (Details/Note)</label>
                            <input type="text" value={expDetail} onChange={e => setExpDetail(e.target.value)} placeholder="કારીગર નું નામ, અથવા અન્ય વિગત..." onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()} className="w-full border border-rose-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500" />
                        </div>
                        <div className="shrink-0 flex items-end gap-2">
                            {editingExp && <button onClick={cancelEdit} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg transition-colors h-[38px]">Cancel</button>}
                            <button onClick={handleAddExpense} disabled={isSaving || !expAmount} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 h-[38px]">
                                {isSaving ? '...' : editingExp ? <><Save className="w-4 h-4"/> અપડેટ (Update)</> : <><Plus className="w-4 h-4"/> ઉમેરો (Add)</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-b shrink-0 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-3">
                             <span className="font-bold text-slate-700 text-sm">મહિનો પસંદ કરો:</span>
                             <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-sm" />
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={() => setShowCategorySummary(!showCategorySummary)} className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-1.5 transition-colors ${showCategorySummary ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                 📊 કેટેગરી મુજબ ખર્ચ (Category Summary) {showCategorySummary ? <ChevronDown className="w-3 h-3 rotate-180"/> : <ChevronDown className="w-3 h-3"/>}
                             </button>
                             <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5 hidden md:flex">
                                 💼 પેટી કેશ હિસાબ (Petty Cash Dashboard)
                             </div>
                         </div>
                     </div>
                     
                     {showCategorySummary && (
                         <div className="w-full mb-4 bg-white p-3 rounded-xl border shadow-sm max-h-48 overflow-y-auto">
                             <table className="w-full text-xs text-left">
                                 <thead className="bg-slate-50 text-slate-500 border-b">
                                     <tr>
                                         <th className="py-1 px-2 uppercase">કેટેગરી (Category)</th>
                                         <th className="py-1 px-2 text-right uppercase">કુલ ખર્ચ (Total)</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {sortedCategoryTotals.length === 0 && <tr><td colSpan="2" className="py-3 text-center text-slate-400 italic">કોઈ ડેટા નથી</td></tr>}
                                     {sortedCategoryTotals.map(([cat, total]) => (
                                         <tr key={cat} className="hover:bg-slate-50">
                                             <td className={`py-1.5 px-2 font-bold ${cat.includes('કારીગર') ? 'text-emerald-700' : 'text-slate-700'}`}>{cat}</td>
                                             <td className={`py-1.5 px-2 text-right font-extrabold ${cat.includes('કારીગર') ? 'text-emerald-600' : 'text-rose-600'}`}>₹{total.toFixed(2)}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}

                     <div className="grid grid-cols-3 gap-4 w-full">
                         <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-center shadow-sm">
                             <p className="text-[10px] sm:text-xs font-bold text-indigo-800 uppercase mb-1">આપેલ પેટી કેશ (Given)</p>
                             <p className="text-xl sm:text-2xl font-extrabold text-indigo-600">₹{monthPettyCashGiven.toFixed(2)}</p>
                         </div>
                         <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center shadow-sm">
                             <p className="text-[10px] sm:text-xs font-bold text-rose-800 uppercase mb-1">થયેલ ખર્ચ (Expenses)</p>
                             <p className="text-xl sm:text-2xl font-extrabold text-rose-600">₹{monthOtherExpenses.toFixed(2)}</p>
                         </div>
                         <div className={`border p-3 rounded-xl text-center shadow-inner relative overflow-hidden ${monthBalance >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                             <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-30 ${monthBalance >= 0 ? 'bg-emerald-200' : 'bg-red-200'}`}></div>
                             <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 relative z-10 ${monthBalance >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>કારીગર પાસે બાકી (Balance)</p>
                             <p className={`text-2xl font-extrabold relative z-10 ${monthBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>₹{monthBalance.toFixed(2)}</p>
                         </div>
                     </div>
                </div>

                <div className="flex-grow overflow-y-auto bg-slate-100 p-4">
                    <table className="min-w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-sm">
                        <thead className="bg-slate-200 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-300 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left">No.</th>
                                <th className="px-4 py-3 text-left">તારીખ (Date)</th>
                                <th className="px-4 py-3 text-left">કેટેગરી (Category)</th>
                                <th className="px-4 py-3 text-left">વિગત (Details)</th>
                                <th className="px-4 py-3 text-right">રકમ (Amount)</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-400 italic font-medium">આ મહિનાનો કોઈ ખર્ચ નોંધાયેલ નથી.</td></tr>
                            ) : (
                                filteredExpenses.map((exp, index) => {
                                    const isKarigar = exp.category?.includes('કારીગર') || exp.category?.includes('Staff Petty Cash');
                                    return (
                                    <tr key={exp.id} className="hover:bg-rose-50/50 transition-colors">
                                        <td className="px-4 py-2.5 text-slate-500 font-medium">{index + 1}</td>
                                        <td className="px-4 py-2.5 font-bold text-slate-700 text-xs">{new Date(exp.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</td>
                                        <td className={`px-4 py-2.5 font-bold text-xs ${isKarigar ? 'text-emerald-700' : 'text-rose-700'}`}>{exp.category}</td>
                                        <td className="px-4 py-2.5 text-slate-600 text-xs">{exp.description || '-'}</td>
                                        <td className={`px-4 py-2.5 text-right font-extrabold ${isKarigar ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(exp.amount).toFixed(2)}</td>
                                        <td className="px-4 py-2.5 text-center flex justify-center gap-1">
                                            {isAdmin ? (
                                                <>
                                                    <button onClick={() => handleEdit(exp)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit"><Edit className="w-4 h-4"/></button>
                                                    <button onClick={() => confirmDelete(exp)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">Read Only</span>
                                            )}
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 sticky bottom-0 border-t-2 border-slate-300">
                             <tr className="bg-indigo-50/70 border-b border-slate-200">
                                 <td colSpan="4" className="px-4 py-2.5 text-right font-bold text-indigo-800 text-xs uppercase tracking-wide">કુલ આપેલ પેટી કેશ (Total Given):</td>
                                 <td className="px-4 py-2.5 text-right font-extrabold text-indigo-600 text-base">₹{monthPettyCashGiven.toFixed(2)}</td>
                                 <td></td>
                             </tr>
                             <tr className="bg-rose-50/70 border-b border-slate-200">
                                 <td colSpan="4" className="px-4 py-2.5 text-right font-bold text-rose-800 text-xs uppercase tracking-wide">કુલ થયેલ ખર્ચ (Total Expenses):</td>
                                 <td className="px-4 py-2.5 text-right font-extrabold text-rose-600 text-base">₹{monthOtherExpenses.toFixed(2)}</td>
                                 <td></td>
                             </tr>
                             <tr className={`border-t-2 ${monthBalance >= 0 ? 'bg-emerald-50/80 border-emerald-200' : 'bg-red-50/80 border-red-200'}`}>
                                 <td colSpan="4" className={`px-4 py-3 text-right font-bold text-sm uppercase tracking-wide ${monthBalance >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>કારીગર પાસે બાકી (Balance):</td>
                                 <td className={`px-4 py-3 text-right font-extrabold text-xl ${monthBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>₹{monthBalance.toFixed(2)}</td>
                                 <td></td>
                             </tr>
                        </tfoot>
                    </table>
                </div>

                {/* DELETE CONFIRMATION MODAL */}
                {expenseToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col border-2 border-rose-500 overflow-hidden transform transition-all">
                            <div className="bg-rose-50 p-6 text-center">
                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-200">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-rose-800 mb-2">શું આ ખર્ચ ડિલીટ કરવો છે?</h3>
                                <p className="text-sm text-rose-600 font-medium mb-1">તમે <b>{expenseToDelete.category}</b> નો <b>₹{expenseToDelete.amount}</b> નો ખર્ચ કાઢી રહ્યા છો.</p>
                                <p className="text-xs text-rose-500 mb-6">એકવાર કાઢી નાખ્યા પછી પાછો મળશે નહીં.</p>
                                <div className="flex gap-3 justify-center">
                                    <button type="button" onClick={() => setExpenseToDelete(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors flex-1 shadow-sm">ના (Cancel)</button>
                                    <button type="button" onClick={executeDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex-1 shadow-sm">હા, ડિલીટ કરો</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- NEW: GLOBAL SEARCH MODAL ---
// SHARED NOTES MODAL (NEW FEATURE)
// ============================================================================
const SharedNotesModal = ({ onClose, notes, db, appId, operatorName }) => {
    const [newNote, setNewNote] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [showDone, setShowDone] = useState(false);

    const activeNotes = notes.filter(n => !n.isDone).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const doneNotes = notes.filter(n => n.isDone).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shared_notes'), {
                text: newNote.trim(),
                isImportant: isImportant,
                isDone: false,
                createdBy: operatorName || 'Unknown',
                createdAt: new Date().toISOString(),
                completedBy: null,
                completedAt: null
            });
            setNewNote('');
            setIsImportant(false);
        } catch (err) {
            alert('નોંધ ઉમેરવામાં ભૂલ થઈ.');
        }
    };

    const handleToggleDone = async (note) => {
        const isNowDone = !note.isDone;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shared_notes', note.id), {
                isDone: isNowDone,
                completedBy: isNowDone ? (operatorName || 'Unknown') : null,
                completedAt: isNowDone ? new Date().toISOString() : null
            });
        } catch (err) {
            alert('સ્ટેટસ અપડેટમાં ભૂલ થઈ.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("આ નોંધ કાયમ માટે ડિલીટ કરવી છે?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shared_notes', id));
        } catch (err) {
            alert('ડિલીટ કરવામાં ભૂલ થઈ.');
        }
    };

    const formatNoteDate = (isoStr) => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[85vh] overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><StickyNote className="w-6 h-6"/> નોટ્સ અને કામકાજ (Notes)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-4 bg-amber-50 border-b border-amber-200 shrink-0 flex flex-col gap-3">
                    <textarea 
                        value={newNote} 
                        onChange={(e) => setNewNote(e.target.value)} 
                        placeholder="નવું કામ, કસ્ટમરનો કોલ, અથવા કોઈ નોંધ અહીં લખો..." 
                        className="w-full border-2 border-amber-300 rounded-xl p-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 resize-none h-20"
                    />
                    <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border shadow-sm hover:bg-slate-50">
                            <input 
                                type="checkbox" 
                                checked={isImportant} 
                                onChange={(e) => setIsImportant(e.target.checked)} 
                                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                            />
                            <span className="text-sm font-bold text-rose-700 flex items-center gap-1">Important (અગત્યનું) <AlertTriangle className="w-4 h-4"/></span>
                        </label>
                        <button 
                            onClick={handleAddNote} 
                            disabled={!newNote.trim()} 
                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5"/> ઉમેરો (Add)
                        </button>
                    </div>
                </div>

                <div className="flex bg-slate-100 border-b shrink-0">
                    <button onClick={() => setShowDone(false)} className={`flex-1 py-3 font-bold text-sm ${!showDone ? 'bg-white text-amber-700 border-b-2 border-amber-500' : 'text-slate-500 hover:bg-slate-200'}`}>
                        બાકી કામકાજ (Active) - {activeNotes.length}
                    </button>
                    <button onClick={() => setShowDone(true)} className={`flex-1 py-3 font-bold text-sm ${showDone ? 'bg-white text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-200'}`}>
                        પૂર્ણ થયેલ (Done) - {doneNotes.length}
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto bg-slate-50 p-4 space-y-3">
                    {!showDone ? (
                        activeNotes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                                <CheckCircle className="w-12 h-12 mb-2 text-emerald-200"/>
                                <p>કોઈ બાકી કામ નથી!</p>
                            </div>
                        ) : (
                            activeNotes.map((note, index) => (
                                <div key={note.id} className={`p-4 rounded-xl border-2 shadow-sm flex gap-4 items-start transition-all ${note.isImportant ? 'bg-rose-50 border-rose-400' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                                    <div className="shrink-0 mt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={false} 
                                            onChange={() => handleToggleDone(note)} 
                                            className="w-5 h-5 cursor-pointer text-emerald-500 rounded focus:ring-emerald-500"
                                            title="Mark as Done"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <p className={`font-bold text-base leading-snug ${note.isImportant ? 'text-rose-900' : 'text-slate-800'}`}>
                                                <span className="text-slate-400 mr-2">#{index + 1}</span>
                                                {note.text}
                                            </p>
                                            {note.isImportant && (
                                                <div className="shrink-0 ml-2 bg-rose-100 p-1.5 rounded-full shadow border border-rose-300">
                                                    <BellRing className="w-5 h-5 text-rose-600 animate-bounce" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 bg-black/5 inline-block px-2 py-1 rounded">
                                            <span>✍️ Created by: <span className="text-indigo-600">{note.createdBy}</span></span>
                                            <span>🕒 {formatNoteDate(note.createdAt)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(note.id)} className="shrink-0 p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))
                        )
                    ) : (
                        doneNotes.length === 0 ? (
                            <div className="text-center text-slate-400 italic py-8">કોઈ પૂર્ણ થયેલ નોંધ નથી.</div>
                        ) : (
                            doneNotes.map((note, index) => (
                                <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-slate-100 flex gap-4 items-start opacity-80">
                                    <div className="shrink-0 mt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={true} 
                                            onChange={() => handleToggleDone(note)} 
                                            className="w-5 h-5 cursor-pointer text-emerald-500 rounded focus:ring-emerald-500"
                                            title="Mark as Undone"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-slate-500 line-through mb-2"><span className="text-slate-400 mr-2">#{index + 1}</span>{note.text}</p>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-medium text-slate-400">Created by: {note.createdBy} ({formatNoteDate(note.createdAt)})</span>
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded w-fit border border-emerald-200">
                                                ✅ Done by: {note.completedBy} at {formatNoteDate(note.completedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(note.id)} className="shrink-0 p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// STAFF MANAGEMENT COMPONENTS
// ============================================================================

const WorkDiaryModal = ({ onClose, db, appId, user, staffProfiles, staffEntries, staffAttendance, staffTasks }) => {
    const dynamicStaffList = Array.from(new Set([
        ...staffProfiles.map(p => p.staffName),
        ...staffEntries.map(s => s.staffName),
        ...(staffAttendance || []).map(a => a.staffName)
    ])).filter(Boolean).sort();

    const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [taskDetail, setTaskDetail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [filterStaff, setFilterStaff] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('PENDING');

    const [completingTask, setCompletingTask] = useState(null);
    const [completionNote, setCompletionNote] = useState('');
    const [deletedIds, setDeletedIds] = useState([]);

    useEffect(() => {
        if (!selectedStaff && dynamicStaffList.length > 0) {
            setSelectedStaff(dynamicStaffList[0]);
        }
    }, [dynamicStaffList, selectedStaff]);

    const handleAddTask = async () => {
        if (!selectedStaff) return alert('પહેલા કારીગરનું ખાતું ખોલો (Staff પસંદ કરો).');
        if (!taskDetail.trim()) return alert('કામની વિગત લખો.');
        
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_tasks'), {
                staffName: selectedStaff,
                taskDetail: taskDetail.trim(),
                assignedDate: taskDate,
                status: 'PENDING',
                userId: user?.uid || 'unknown',
                createdAt: serverTimestamp()
            });
            setTaskDetail('');
        } catch (err) {
            alert('ભૂલ થઈ.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (task) => {
        if (task.status === 'PENDING') {
            setCompletingTask(task);
            setCompletionNote('');
        } else {
            try {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_tasks', task.id), {
                    status: 'PENDING',
                    completedDate: null,
                    completionNote: '', 
                    updatedAt: serverTimestamp()
                });
            } catch (err) { alert('સ્ટેટસ અપડેટમાં ભૂલ થઈ.'); }
        }
    };

    const handleConfirmCompletion = async () => {
        if (!completingTask) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_tasks', completingTask.id), {
                status: 'COMPLETED',
                completedDate: new Date().toISOString(),
                completionNote: completionNote.trim(),
                updatedAt: serverTimestamp()
            });
            setCompletingTask(null);
            setCompletionNote('');
        } catch (err) {
            alert('સ્ટેટસ અપડેટમાં ભૂલ થઈ.');
        }
    };

    const confirmDeleteTask = async (id) => {
        if (!id || !window.confirm("શું તમે આ એન્ટ્રી ડિલીટ કરવા માંગો છો?")) return;
        setDeletedIds(prev => [...prev, id]);
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_tasks', id));
        } catch(err) { 
            setDeletedIds(prev => prev.filter(dId => dId !== id));
            alert('ડિલીટમાં ભૂલ થઈ.'); 
        }
    };

    const filteredTasks = staffTasks.filter(t => {
        if (deletedIds.includes(t.id)) return false;
        if (filterStaff !== 'ALL' && t.staffName !== filterStaff) return false;
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
        return true;
    }).sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-cyan-700 text-white rounded-t-xl shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Book className="w-6 h-6"/> વર્ક ડાયરી (Work Diary)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-cyan-600 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-4 bg-cyan-50 border-b shrink-0 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-cyan-800 mb-1">તારીખ</label>
                        <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="border border-cyan-300 rounded px-3 py-2 text-sm font-bold w-36 outline-none" />
                    </div>
                    <div className="flex-grow">
                        <label className="block text-xs font-bold text-cyan-800 mb-1">સ્ટાફ મેમ્બર</label>
                        <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full border border-cyan-300 rounded px-3 py-2 text-sm font-bold outline-none">
                            {dynamicStaffList.length === 0 && <option value="">-- No Staff --</option>}
                            {dynamicStaffList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex-grow w-full md:w-auto">
                        <label className="block text-xs font-bold text-cyan-800 mb-1">કામની વિગત (Task Description)</label>
                        <input type="text" value={taskDetail} onChange={(e) => setTaskDetail(e.target.value)} placeholder="આજે શું કામ કરવાનું છે..." className="w-full border border-cyan-300 rounded px-3 py-2 text-sm font-bold outline-none" />
                    </div>
                    <button onClick={handleAddTask} disabled={isSaving || !selectedStaff} className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg font-bold transition-colors shadow flex items-center gap-2">
                        <Plus className="w-4 h-4"/> ઉમેરો
                    </button>
                </div>

                <div className="p-4 bg-slate-100 flex gap-4 shrink-0 border-b border-slate-200">
                    <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="border rounded px-3 py-1.5 text-sm font-bold bg-white">
                        <option value="ALL">બધા સ્ટાફ (All Staff)</option>
                        {dynamicStaffList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm font-bold bg-white">
                        <option value="ALL">બધા સ્ટેટસ (All)</option>
                        <option value="PENDING">બાકી (Pending)</option>
                        <option value="COMPLETED">પૂર્ણ (Completed)</option>
                    </select>
                </div>

                <div className="flex-grow overflow-y-auto p-4 bg-slate-50">
                    {completingTask && (
                        <div className="mb-4 bg-white p-4 rounded-lg border-2 border-emerald-400 shadow-md flex flex-col md:flex-row gap-3 items-center">
                            <div className="flex-grow">
                                <p className="text-sm font-bold mb-1">કામ પૂર્ણ કરો: <span className="text-emerald-700">{completingTask.taskDetail}</span></p>
                                <input type="text" value={completionNote} onChange={(e) => setCompletionNote(e.target.value)} placeholder="નોંધ (વૈકલ્પિક)..." className="w-full border rounded px-3 py-1.5 text-sm" />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => setCompletingTask(null)} className="px-3 py-1.5 bg-slate-200 font-bold rounded">રદ કરો</button>
                                <button onClick={handleConfirmCompletion} className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded">કન્ફર્મ</button>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        {filteredTasks.length === 0 ? <div className="text-center text-slate-400 py-8 italic font-medium">કોઈ નોંધ નથી.</div> : 
                            filteredTasks.map(task => (
                                <div key={task.id} className={`p-4 rounded-xl border shadow-sm flex items-start gap-4 transition-colors ${task.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 opacity-80' : 'bg-white border-slate-200'}`}>
                                    <button onClick={() => toggleStatus(task)} className="mt-0.5 shrink-0">
                                        {task.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <div className="w-6 h-6 rounded-full border-2 hover:border-cyan-500"></div>}
                                    </button>
                                    <div className="flex-grow">
                                        <div className="flex justify-between">
                                            <p className={`font-bold ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-800'}`}>{task.taskDetail}</p>
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border">{task.assignedDate}</span>
                                        </div>
                                        <p className="text-xs font-bold text-indigo-600 mt-1">{task.staffName}</p>
                                        {task.completionNote && <p className="text-xs text-emerald-700 mt-1 italic">નોંધ: {task.completionNote}</p>}
                                    </div>
                                    <button onClick={() => confirmDeleteTask(task.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

const StaffListModal = ({ onClose, onSelect, staffEntries, staffAttendance, staffProfiles }) => {
    const [newStaffName, setNewStaffName] = useState('');

    const dynamicStaffList = Array.from(new Set([
        ...staffProfiles.map(p => p.staffName),
        ...staffEntries.map(s => s.staffName),
        ...(staffAttendance || []).map(a => a.staffName)
    ])).filter(Boolean).sort();

    const handleAddNew = () => {
        const name = newStaffName.trim().toUpperCase();
        if (name) { onSelect(name); setNewStaffName(''); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-violet-700 text-white rounded-t-xl shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><UserCheck className="w-6 h-6"/> સ્ટાફ મેનેજમેન્ટ</h3>
                    <button onClick={onClose} className="p-1 hover:bg-violet-600 rounded-full"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-6 bg-violet-50 border-b flex gap-3 shrink-0">
                    <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="નવા કારીગરનું નામ..." className="flex-grow border rounded-lg px-4 py-2 font-bold outline-none uppercase" />
                    <button onClick={handleAddNew} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Plus className="w-4 h-4"/> નવું ખાતું 
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-slate-50">
                    {dynamicStaffList.length === 0 ? (
                        <div className="text-center text-slate-400 py-12 italic">કોઈ સ્ટાફનું નામ મળ્યું નથી.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {dynamicStaffList.map(name => (
                                <button key={name} onClick={() => onSelect(name)} className="bg-white border-2 hover:border-violet-400 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm group">
                                    <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                        <UserCheck className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm">{name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StaffAccountDetailModal = ({ staffName, onClose, staffEntries, staffAttendance, staffProfiles, db, appId, user }) => {
    const profile = staffProfiles.find(p => p.staffName === staffName);
    const [dailyWage, setDailyWage] = useState(profile?.dailyWage || '');
    
    const [entryMode, setEntryMode] = useState('ATTENDANCE'); 
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [entryNote, setEntryNote] = useState('');
    
    const [attStatus, setAttStatus] = useState('PRESENT');
    const [attOvertime, setAttOvertime] = useState('');
    const [editingAttId, setEditingAttId] = useState(null);

    const [entryAmount, setEntryAmount] = useState('');
    const [editingLedgerId, setEditingLedgerId] = useState(null);

    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [isSaving, setIsSaving] = useState(false);

    const [inTime, setInTime] = useState('09:00');
    const [outTime, setOutTime] = useState('19:00');
    const [isBulkEntry, setIsBulkEntry] = useState(false);
    const [entryEndDate, setEntryEndDate] = useState(new Date().toISOString().split('T')[0]);

    // NEW: Bulk Delete States
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    const calculateTotalTime = (inT, outT) => {
        if(!inT || !outT) return '-';
        const [inH, inM] = inT.split(':').map(Number);
        const [outH, outM] = outT.split(':').map(Number);
        let diffM = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffM < 0) diffM += 24 * 60; 
        const h = Math.floor(diffM / 60);
        const m = diffM % 60;
        return `${h}h ${m}m`;
    };

    const formatTime12h = (time24) => {
        if(!time24) return '';
        let [h, m] = time24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const cancelEdit = () => {
        setEditingAttId(null);
        setEditingLedgerId(null);
        setEntryDate(new Date().toISOString().split('T')[0]);
        setEntryEndDate(new Date().toISOString().split('T')[0]);
        setEntryNote('');
        setAttStatus('PRESENT');
        setAttOvertime('');
        setEntryAmount('');
        setInTime('09:00');
        setOutTime('19:00');
        setIsBulkEntry(false);
    };

    const handleEditEntry = (row) => {
        setEntryMode(row.type === 'ATT' ? 'ATTENDANCE' : (row.ledgerType === 'EXTRA' ? 'EXTRA' : 'LEDGER'));
        setEntryDate(row.date);
        setEntryNote(row.note || '');
        if (row.type === 'ATT') {
            setAttStatus(row.status || 'PRESENT');
            setAttOvertime(row.overtime || '');
            setInTime(row.inTime || '09:00');
            setOutTime(row.outTime || '19:00');
            setEditingAttId(row.id);
            setEditingLedgerId(null);
        } else {
            setEntryAmount(row.amount || '');
            setEditingLedgerId(row.id);
            setEditingAttId(null);
        }
        setIsBulkEntry(false);
    };

    const handleSaveProfile = async () => {
        try {
            if (profile?.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_profiles', profile.id), { dailyWage, updatedAt: serverTimestamp() });
            else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_profiles'), { staffName, dailyWage, userId: user?.uid, createdAt: serverTimestamp() });
            alert("પ્રોફાઇલ સેવ થઈ ગઈ.");
        } catch (err) { alert("ભૂલ થઈ."); }
    };

    const calculateEarning = (status, otHours, currentWage) => {
        let earned = 0;
        const wageNum = Number(currentWage) || 0;
        if (status === 'PRESENT') earned += wageNum;
        else if (status === 'HALF_DAY') earned += wageNum / 2;
        if (otHours && wageNum > 0) {
            const hourlyRate = wageNum / 8.5; 
            earned += (hourlyRate * 1.5) * Number(otHours); 
        }
        return Math.round(earned);
    };

    const handleSaveEntry = async () => {
        if (!entryDate) return alert("તારીખ પસંદ કરો.");
        if (isBulkEntry && entryMode === 'ATTENDANCE' && entryEndDate < entryDate) {
            return alert("અંતિમ તારીખ (To Date) શરુઆતની તારીખ કરતા મોટી હોવી જોઈએ.");
        }
        setIsSaving(true);
        try {
            if (entryMode === 'ATTENDANCE') {
                let datesToProcess = [entryDate];
                if (isBulkEntry && !editingAttId) {
                    datesToProcess = [];
                    let curr = new Date(entryDate);
                    let end = new Date(entryEndDate);
                    while (curr <= end) {
                        const y = curr.getFullYear();
                        const m = String(curr.getMonth() + 1).padStart(2, '0');
                        const d = String(curr.getDate()).padStart(2, '0');
                        datesToProcess.push(`${y}-${m}-${d}`);
                        curr.setDate(curr.getDate() + 1);
                    }
                }

                if (editingAttId) {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_attendance', editingAttId), { 
                        date: entryDate, status: attStatus, overtime: attOvertime, note: entryNote, 
                        inTime, outTime, updatedAt: serverTimestamp() 
                    });
                } else {
                    const promises = datesToProcess.map(d => 
                        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_attendance'), { 
                            staffName, date: d, status: attStatus, overtime: attOvertime, note: entryNote, 
                            inTime, outTime, userId: user?.uid, createdAt: serverTimestamp() 
                        })
                    );
                    await Promise.all(promises);
                }
            } else {
                if (!entryAmount) return alert("રકમ દાખલ કરો.");
                const lType = entryMode === 'EXTRA' ? 'EXTRA' : 'ADVANCE';
                if (editingLedgerId) {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_ledger', editingLedgerId), { date: entryDate, amount: entryAmount, note: entryNote, ledgerType: lType, updatedAt: serverTimestamp() });
                } else {
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_ledger'), { staffName, date: entryDate, amount: entryAmount, note: entryNote, ledgerType: lType, userId: user?.uid, createdAt: serverTimestamp() });
                }
            }
            cancelEdit();
        } catch (err) { alert("ભૂલ થઈ."); } finally { setIsSaving(false); }
    };

    const handleDeleteEntry = async (id, isLedger) => {
        if (!id || !window.confirm("ડિલીટ કરવું છે?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', isLedger ? 'staff_ledger' : 'staff_attendance', id));
            cancelEdit();
        } catch (err) { alert("ભૂલ થઈ."); }
    };

    const filteredAtt = staffAttendance.filter(a => a.staffName === staffName && a.date.startsWith(monthFilter)).sort((a,b) => new Date(b.date) - new Date(a.date));
    const filteredLedger = staffEntries.filter(e => e.staffName === staffName && e.date.startsWith(monthFilter)).sort((a,b) => new Date(b.date) - new Date(a.date));

    let totalEarned = 0; filteredAtt.forEach(a => totalEarned += calculateEarning(a.status, a.overtime, dailyWage));
    let totalAdvance = 0; 
    filteredLedger.forEach(e => {
        if (e.ledgerType === 'EXTRA') {
            totalEarned += Number(e.amount) || 0;
        } else {
            totalAdvance += Number(e.amount) || 0;
        }
    });

    const allEntriesList = [...filteredAtt.map(a => ({...a, type: 'ATT'})), ...filteredLedger.map(e => ({...e, type: 'LED'}))]
        .sort((a,b) => new Date(b.date) - new Date(a.date));

    // Toggle single entry checkbox
    const toggleEntrySelection = (id) => {
        setSelectedEntries(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
    };

    // Toggle all entries checkbox
    const toggleAllEntries = () => {
        if (selectedEntries.length === allEntriesList.length && allEntriesList.length > 0) {
            setSelectedEntries([]);
        } else {
            setSelectedEntries(allEntriesList.map(e => e.id));
        }
    };

    // Confirm and perform Bulk Delete
    const handleBulkDeleteConfirm = async () => {
        setIsSaving(true);
        try {
            const entriesToDelete = allEntriesList.filter(e => selectedEntries.includes(e.id));
            for (let entry of entriesToDelete) {
                const colName = entry.type === 'LED' ? 'staff_ledger' : 'staff_attendance';
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, entry.id));
            }
            setSelectedEntries([]);
            setShowBulkDeleteModal(false);
            alert(`${entriesToDelete.length} એન્ટ્રી સફળતાપૂર્વક ડિલીટ થઈ ગઈ.`);
        } catch (err) {
            alert("ડિલીટ કરવામાં ભૂલ થઈ.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintHajariCard = () => {
        const [year, month] = monthFilter.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        let totalDaysPresent = 0;
        let totalOT = 0;
        let totalAdvanceCard = 0;
        let totalExtraCard = 0;

        let rowsHtml = '';
        for (let i = 1; i <= 31; i++) {
            let dayStr = '';
            let isSunday = false;
            let inT = '', outT = '', totT = '', ot = '', adv = '';

            if (i <= daysInMonth) {
                const d = new Date(year, month - 1, i);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                dayStr = dayNames[d.getDay()];
                isSunday = d.getDay() === 0;

                const dateStr = `${year}-${month.padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                
                // Find attendance and ledger entries for this date
                const attEntry = filteredAtt.find(a => a.date === dateStr);
                const ledEntriesForDay = filteredLedger.filter(e => e.date === dateStr);

                if (attEntry && attEntry.status !== 'ABSENT') {
                    inT = formatTime12h(attEntry.inTime) || '';
                    outT = formatTime12h(attEntry.outTime) || '';
                    if (attEntry.inTime && attEntry.outTime) {
                        totT = calculateTotalTime(attEntry.inTime, attEntry.outTime);
                    }
                    if (attEntry.overtime) {
                        ot = attEntry.overtime;
                        totalOT += Number(attEntry.overtime);
                    }
                    totalDaysPresent += (attEntry.status === 'HALF_DAY' ? 0.5 : 1);
                }

                let advForDay = 0;
                ledEntriesForDay.forEach(e => {
                    if (e.ledgerType === 'EXTRA') {
                        totalExtraCard += Number(e.amount) || 0;
                    } else {
                        advForDay += Number(e.amount) || 0;
                        totalAdvanceCard += Number(e.amount) || 0;
                    }
                });
                if (advForDay > 0) adv = advForDay;
            }

            const rowStyle = isSunday ? 'background-color: #d1d5db;' : '';
            rowsHtml += `<tr style="${rowStyle}">
                <td style="font-weight:bold;">${i <= daysInMonth ? i : ''}</td>
                <td style="font-weight:bold;">${dayStr}</td>
                <td>${inT}</td>
                <td>${outT}</td>
                <td style="font-weight:bold;">${totT !== '-' ? totT : ''}</td>
                <td style="font-weight:bold;">${ot}</td>
                <td style="font-weight:bold;">${adv}</td>
                <td></td>
            </tr>`;
        }

        const cardHtml = `
            <div class="card">
                <div class="header">
                    <div>Staff Name: <span class="line-input" style="min-width:300px;">${staffName}</span></div>
                    <div>Month: <span class="line-input" style="min-width:200px; text-align:center;">${monthName}</span></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Day</th>
                            <th>In Time</th>
                            <th>Out Time</th>
                            <th>Total Time</th>
                            <th>Over Time</th>
                            <th>Advance</th>
                            <th>Sign</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align:left; padding-left:10px;">Total Days: <span style="margin-left:5px; font-size:16px;">${totalDaysPresent > 0 ? totalDaysPresent : ''}</span></td>
                            <td colspan="2" style="text-align:left; padding-left:10px;">O.T. Hrs: <span style="margin-left:5px; font-size:16px;">${totalOT > 0 ? totalOT : ''}</span></td>
                            <td colspan="3" style="text-align:left; padding-left:10px;">Adv: <span style="margin-left:2px; font-size:14px; margin-right:8px;">${totalAdvanceCard > 0 ? totalAdvanceCard : '0'}</span> Extra: <span style="margin-left:2px; font-size:14px;">${totalExtraCard > 0 ? totalExtraCard : '0'}</span></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        const fullHtml = `
            <html>
            <head>
                <title>Hajari Card - ${staffName}</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body { margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
                    .page-wrapper { width: 100%; height: 185mm; display: flex; flex-direction: column; }
                    .card { height: 100%; width: 100%; border: 2px solid #000; box-sizing: border-box; padding: 4mm; display: flex; flex-direction: column; overflow: hidden; }
                    .header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; padding: 0 5px; font-size: 16px; height: 8mm; align-items: flex-end;}
                    .line-input { text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 1px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; flex-grow: 1; }
                    th:nth-child(1) { width: 5%; } /* Date */
                    th:nth-child(2) { width: 8%; } /* Day */
                    th:nth-child(3) { width: 15%; } /* In Time */
                    th:nth-child(4) { width: 15%; } /* Out Time */
                    th:nth-child(5) { width: 15%; } /* Total Time */
                    th:nth-child(6) { width: 12%; } /* Over Time */
                    th:nth-child(7) { width: 15%; } /* Advance */
                    th:nth-child(8) { width: 15%; } /* Sign */
                    th, td { border: 1px solid #000; text-align: center; padding: 0; font-size: 12px; white-space: nowrap; overflow: hidden; line-height: 1.2;}
                    th { background-color: #e5e7eb; font-weight: bold; height: 6mm; font-size: 14px;}
                    tbody tr { height: 4.5mm; }
                    tfoot td { font-weight: bold; font-size: 14px; height: 8mm; text-align: left; padding-left: 10px; }
                </style>
            </head>
            <body>
                <div class="page-wrapper">
                    ${cardHtml}
                </div>
                <script>
                    setTimeout(() => { window.print(); }, 500);
                </script>
            </body>
            </html>
        `;

        const win = window.open('', '', 'height=800,width=1000');
        win.document.write(fullHtml);
        win.document.close();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-violet-700 text-white rounded-t-xl shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><UserCheck className="w-6 h-6"/> {staffName} - ખાતાવહી</h3>
                    <button onClick={onClose} className="p-1 hover:bg-violet-600 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-4 bg-slate-50 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">રોજ (Daily Wage - ₹)</label>
                            <div className="flex gap-2">
                                <input type="number" value={dailyWage} onChange={e => setDailyWage(e.target.value)} className="w-full border rounded px-3 py-1.5 font-bold outline-none focus:border-violet-500" />
                                <button onClick={handleSaveProfile} className="bg-slate-800 text-white px-3 py-1.5 rounded font-bold hover:bg-slate-900">SAVE</button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border-2 shadow-sm flex-grow">
                            <div className="flex border-b mb-4">
                                <button onClick={() => { setEntryMode('ATTENDANCE'); cancelEdit(); }} className={`flex-1 py-2 font-bold text-sm border-b-2 ${entryMode === 'ATTENDANCE' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500'}`}>હાજરી</button>
                                <button onClick={() => { setEntryMode('EXTRA'); cancelEdit(); }} className={`flex-1 py-2 font-bold text-sm border-b-2 ${entryMode === 'EXTRA' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>એક્સ્ટ્રા / OT (+)</button>
                                <button onClick={() => { setEntryMode('LEDGER'); cancelEdit(); }} className={`flex-1 py-2 font-bold text-sm border-b-2 ${entryMode === 'LEDGER' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500'}`}>ઉપાડ (-)</button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-500">તારીખ</label>
                                        {!editingAttId && entryMode === 'ATTENDANCE' && (
                                            <label className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 cursor-pointer bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                <input type="checkbox" checked={isBulkEntry} onChange={e => setIsBulkEntry(e.target.checked)} className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3" />
                                                એકસાથે (Bulk/Range)
                                            </label>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <input type="date" value={entryDate} onChange={e => { setEntryDate(e.target.value); if(e.target.value > entryEndDate) setEntryEndDate(e.target.value); }} className="w-full border rounded px-3 py-2 font-bold text-sm" />
                                        {isBulkEntry && entryMode === 'ATTENDANCE' && !editingAttId && (
                                            <>
                                                <span className="font-bold text-slate-400 text-xs">થી</span>
                                                <input type="date" value={entryEndDate} min={entryDate} onChange={e => setEntryEndDate(e.target.value)} className="w-full border rounded px-3 py-2 font-bold text-sm" />
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {entryMode === 'ATTENDANCE' ? (
                                    <>
                                        <div className="flex gap-3">
                                            <div className="w-1/2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">In Time</label>
                                                <input type="time" value={inTime} onChange={e => setInTime(e.target.value)} className="w-full border rounded px-3 py-2 font-bold text-sm" />
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Out Time</label>
                                                <input type="time" value={outTime} onChange={e => setOutTime(e.target.value)} className="w-full border rounded px-3 py-2 font-bold text-sm" />
                                            </div>
                                        </div>
                                        <div className="text-right text-[10px] font-bold text-slate-500 mt-0">
                                            Total Time: <span className="text-indigo-600 text-xs">{calculateTotalTime(inTime, outTime)}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-1/2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">સ્ટેટસ</label>
                                                <select value={attStatus} onChange={e => setAttStatus(e.target.value)} className="w-full border rounded px-3 py-2 font-bold text-sm">
                                                    <option value="PRESENT">હાજર (Present)</option>
                                                    <option value="HALF_DAY">અડધો દિવસ (Half Day)</option>
                                                    <option value="ABSENT">ગેરહાજર (Absent)</option>
                                                </select>
                                            </div>
                                            <div className="w-1/2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">ઓવરટાઇમ (કલાક)</label>
                                                <input type="number" placeholder="0" value={attOvertime} onChange={e => setAttOvertime(e.target.value)} className="w-full border rounded px-3 py-2 font-bold text-sm" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className={`block text-xs font-bold ${entryMode === 'EXTRA' ? 'text-indigo-600' : 'text-rose-600'}`}>
                                            {entryMode === 'EXTRA' ? 'એક્સ્ટ્રા કામ / લમ્પસમ OT (₹)' : 'ઉપાડ રકમ (₹)'}
                                        </label>
                                        <input type="number" placeholder="Amount" value={entryAmount} onChange={e => setEntryAmount(e.target.value)} className={`w-full border rounded px-3 py-2 text-lg font-bold ${entryMode === 'EXTRA' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-rose-300 bg-rose-50 text-rose-700'}`} />
                                    </div>
                                )}
                                <div><label className="block text-xs font-bold text-slate-500">નોંધ (Note)</label><input type="text" placeholder="વિગત..." value={entryNote} onChange={e => setEntryNote(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" /></div>
                                
                                <div className="flex gap-2 mt-4">
                                    {(editingAttId || editingLedgerId) && <button onClick={cancelEdit} className="w-1/3 bg-slate-200 font-bold py-2.5 rounded-lg">CANCEL</button>}
                                    <button onClick={handleSaveEntry} disabled={isSaving} className={`${(editingAttId || editingLedgerId) ? 'w-2/3' : 'w-full'} text-white font-bold py-2.5 rounded-lg ${entryMode === 'ATTENDANCE' ? 'bg-violet-600' : entryMode === 'EXTRA' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                                        {isSaving ? '...' : (editingAttId || editingLedgerId) ? 'UPDATE ENTRY' : 'SAVE ENTRY'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm shrink-0">
                            <button onClick={handlePrintHajariCard} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors" title="બ્લેન્ક હાજરી કાર્ડ પ્રિન્ટ કરો">
                                <Printer className="w-4 h-4"/> HAJARI CARD
                            </button>
                            <span className="font-bold text-slate-700 text-sm">મહિનો: <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="border rounded px-2 py-1 ml-2 text-indigo-700" /></span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 shrink-0">
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center"><p className="text-[10px] font-bold text-emerald-600">કુલ કામ</p><p className="text-xl font-extrabold text-emerald-800">₹{totalEarned}</p></div>
                            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center"><p className="text-[10px] font-bold text-rose-600">કુલ ઉપાડ</p><p className="text-xl font-extrabold text-rose-800">₹{totalAdvance}</p></div>
                            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-center"><p className="text-[10px] font-bold text-indigo-600">બાકી નીકળતા</p><p className="text-xl font-extrabold text-indigo-800">₹{totalEarned - totalAdvance}</p></div>
                        </div>

                        <div className="flex-grow bg-white border rounded-xl overflow-hidden flex flex-col relative">
                            {/* BULK DELETE ACTION BAR */}
                            {selectedEntries.length > 0 && (
                                <div className="bg-rose-50 px-4 py-2 flex justify-between items-center border-b border-rose-200 sticky top-0 z-20">
                                    <span className="text-sm font-bold text-rose-800">{selectedEntries.length} એન્ટ્રી સિલેક્ટ કરી છે</span>
                                    <button onClick={() => setShowBulkDeleteModal(true)} className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-rose-700 flex items-center gap-1 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5"/> ડિલીટ કરો
                                    </button>
                                </div>
                            )}
                            <div className="overflow-y-auto h-full">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-600 text-xs sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-3 py-2 w-10 text-center">
                                                <input type="checkbox" checked={selectedEntries.length === allEntriesList.length && allEntriesList.length > 0} onChange={toggleAllEntries} className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-2">તારીખ</th>
                                            <th className="px-3 py-2">પ્રકાર</th>
                                            <th className="px-3 py-2">વિગત</th>
                                            <th className="px-3 py-2 text-right">જમા (+)</th>
                                            <th className="px-3 py-2 text-right">ઉધાર (-)</th>
                                            <th className="px-3 py-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allEntriesList.map(row => (
                                                <tr key={row.id} className={`hover:bg-slate-50 ${selectedEntries.includes(row.id) ? 'bg-indigo-50/50' : ''}`}>
                                                    <td className="px-3 py-2 text-center">
                                                        <input type="checkbox" checked={selectedEntries.includes(row.id)} onChange={() => toggleEntrySelection(row.id)} className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-slate-500">{new Date(row.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}</td>
                                                    <td className="px-3 py-2 text-[10px] font-bold">
                                                        {row.type === 'ATT' ? <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{row.status}</span> : 
                                                         row.ledgerType === 'EXTRA' ? <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">એક્સ્ટ્રા/OT</span> :
                                                         <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">ઉપાડ</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs">
                                                        {row.type === 'ATT' ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                {(row.inTime && row.outTime) && (
                                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                                        In: {formatTime12h(row.inTime)} | Out: {formatTime12h(row.outTime)} <strong className="text-indigo-500">({calculateTotalTime(row.inTime, row.outTime)})</strong>
                                                                    </span>
                                                                )}
                                                                <span>
                                                                    {row.overtime ? <span className="text-indigo-600 font-bold mr-1">OT: {row.overtime}h</span> : null}
                                                                    {row.note}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span>{row.note}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold text-emerald-600">
                                                        {row.type === 'ATT' ? `₹${calculateEarning(row.status, row.overtime, dailyWage)}` : 
                                                         row.ledgerType === 'EXTRA' ? `₹${row.amount}` : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold text-rose-600">
                                                        {row.type === 'LED' && row.ledgerType !== 'EXTRA' ? `₹${row.amount}` : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-center flex justify-center gap-1">
                                                        <button onClick={() => handleEditEntry(row)} className="text-indigo-400 p-1 hover:bg-indigo-50 rounded" title="Edit"><Edit className="w-3.5 h-3.5"/></button>
                                                        <button onClick={() => handleDeleteEntry(row.id, row.type === 'LED')} className="text-rose-400 p-1 hover:bg-rose-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {allEntriesList.length === 0 && (
                                            <tr><td colSpan="7" className="text-center py-6 text-slate-400 italic">કોઈ એન્ટ્રી નથી.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BULK DELETE CONFIRMATION MODAL */}
                {showBulkDeleteModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col border-2 border-rose-500 overflow-hidden">
                            <div className="bg-rose-50 p-6 text-center">
                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-rose-800 mb-2">શું આ બધી એન્ટ્રી ડિલીટ કરવી છે?</h3>
                                <p className="text-sm text-rose-600 font-medium mb-6">તમે <b>{selectedEntries.length}</b> એન્ટ્રી સિલેક્ટ કરી છે. એકવાર કાઢી નાખ્યા પછી પાછી મળશે નહીં.</p>
                                <div className="flex gap-3 justify-center">
                                    <button type="button" onClick={() => setShowBulkDeleteModal(false)} disabled={isSaving} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors flex-1">ના (Cancel)</button>
                                    <button type="button" onClick={handleBulkDeleteConfirm} disabled={isSaving} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex-1">{isSaving ? '...' : 'હા, ડિલીટ કરો'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function App() {
  const [user, setUser] = useState({ uid: 'local-user' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false); 
  const [googleSheetSending, setGoogleSheetSending] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(''); 
  const [showPrintTip, setShowPrintTip] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 
  
  // UI States
  const [viewModalData, setViewModalData] = useState(null); 
  const [currentDocId, setCurrentDocId] = useState(null); 
  const [isOnline, setIsOnline] = useState(navigator.onLine); 
  const [showDesignModal, setShowDesignModal] = useState(null); 
  const [showOutstandingPaymentModal, setShowOutstandingPaymentModal] = useState(null); 
  const [showStatusReasonModal, setShowStatusReasonModal] = useState(null);
  const [showPrintingModal, setShowPrintingModal] = useState(null);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState(null); 
  
  const [deliveredFilterType, setDeliveredFilterType] = useState('ALL');
  const [language, setLanguage] = useState('Gujarati'); 
  const [isRegisterExpanded, setIsRegisterExpanded] = useState(false); 

  // NEW STATES
  const [rojmelPassword, setRojmelPassword] = useState(''); 
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showStaffListModal, setShowStaffListModal] = useState(false);
  const [showStaffAccountModal, setShowStaffAccountModal] = useState(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showStaffMenu, setShowStaffMenu] = useState(false); 
  const [showPhoneMatchModal, setShowPhoneMatchModal] = useState(null); 
  const [showGlobalSearch, setShowGlobalSearch] = useState(false); 
  const [kankotriInventory, setKankotriInventory] = useState([]); 
  const [showInventoryModal, setShowInventoryModal] = useState(false); 
  const [staffTasks, setStaffTasks] = useState([]);
  const [staffEntries, setStaffEntries] = useState([]);
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  
  // NEW STATE FOR NOTES & EXPENSES
  const [sharedNotes, setSharedNotes] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // NEW STATE FOR MOBILE MENU

  // --- PRINTING & BACKUP STATES ---
  const [printingAll, setPrintingAll] = useState(false);
  const [exportJobs, setExportJobs] = useState([]); // <--- NEW STATE FOR SPECIFIC DAY EXPORT
  const [isAutoDownloading, setIsAutoDownloading] = useState(false);
  const [showJpgPrompt, setShowJpgPrompt] = useState(false);
  const [showRojmelPrompt, setShowRojmelPrompt] = useState(false); // <--- NEW STATE FOR ROJMEL PROMPT
  const [showFullBackupPrompt, setShowFullBackupPrompt] = useState(false); // <--- NEW STATE FOR FULL DB BACKUP
  const [jpgProgress, setJpgProgress] = useState({ current: 0, total: 0, isGenerating: false });

  // --- LAST UPDATE TIME ---
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // LLM States
  const [llmLoading, setLlmLoading] = useState(null); 
  const [llmFeedback, setLlmFeedback] = useState({}); 
  
  // Form State
  const [estNo, setEstNo] = useState(new Date() >= new Date('2026-04-01T00:00:00') ? 'M-000' : 'ES-000'); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [operatorName, setOperatorName] = useState('Murtazabhai');
  const [status, setStatus] = useState('Order Placed Successfully'); 
  const [designerName, setDesignerName] = useState(''); 
  const [printingVendor, setPrintingVendor] = useState(''); 
  const [cancelReason, setCancelReason] = useState(''); 
  
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [items, setItems] = useState([
    { id: 1, particular: '', detail: '', qty: 1, rate: 0, amount: 0, isDelivered: false }
  ]);
  
  const [payments, setPayments] = useState([]); 
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('CASH');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [proofDate, setProofDate] = useState(''); 
  const [proofDays, setProofDays] = useState(''); 
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const [history, setHistory] = useState([]);
  
  // NEW: Track original state for accurate stock difference calculations
  const [originalItems, setOriginalItems] = useState([]);
  const [originalStatus, setOriginalStatus] = useState('Order Placed Successfully');
  
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [deliveredSearchTerm, setDeliveredSearchTerm] = useState('');
  const deferredDeliveredSearchTerm = useDeferredValue(deliveredSearchTerm);
  
  const [activeLimit, setActiveLimit] = useState(100);
  const [deliveredLimit, setDeliveredLimit] = useState(100);

  // NEW: Status Filter for Active Register
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');

  const [focusedDetailId, setFocusedDetailId] = useState(null); // NEW: To track which detail input is focused for dropdown

  const fileInputRef = useRef(null);

  const isSheetConfigured = GOOGLE_SHEET_WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' && GOOGLE_SHEET_WEB_APP_URL.startsWith('https://script.google.com/macros/s/');

  const printRef = useRef();

  // --- EXTRA LAYER BUG FIX ---
  useEffect(() => {
      // Force body to be interactive
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';

      // Remove any external rogue overlays that might block clicks
      const removeExtraLayers = () => {
          const layers = document.querySelectorAll('.overlay, .modal-backdrop, #loading-layer');
          layers.forEach(layer => {
              if (layer) {
                  layer.style.display = 'none';
                  layer.style.pointerEvents = 'none';
              }
          });
      };
      
      removeExtraLayers();
      
      // Set a tiny timeout to catch layers added just after load
      setTimeout(removeExtraLayers, 1000);
  }, []);
  // --- END EXTRA LAYER BUG FIX ---

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const savedOp = localStorage.getItem('operatorName');
    if (savedOp && operators.includes(savedOp)) {
        setOperatorName(savedOp);
    }
  }, []);

  useEffect(() => {
    const loadData = () => {
      const data = localDB.get('estimates').map(d => {
        return { 
          ...d,
          totalAmount: Number(d.totalAmount) || 0,
          advance: Number(d.advance) || 0,
          outstanding: Number(d.outstanding) || 0,
          _sortTime: parseDateTime(d.date, d.time),
          _estNoNum: parseInt(d.estNo?.replace(/[^0-9]/g, '') || '0')
        };
      });
      
      const today = new Date();
      const isNewFinancialYear = today >= new Date('2026-04-01T00:00:00');
      const currentPrefix = isNewFinancialYear ? 'M-' : 'ES-';

      if (!currentDocId) {
          let maxId = 0;
          data.forEach(d => {
            if (d.estNo?.startsWith(currentPrefix)) {
                const numPart = parseInt(d.estNo.replace(currentPrefix, '') || '0');
                if (numPart > maxId) maxId = numPart;
            }
          });
          
          setEstNo(`${currentPrefix}${String(maxId + 1).padStart(3, '0')}`);
      }

      data.sort((a, b) => {
        if (b._sortTime !== a._sortTime) return b._sortTime - a._sortTime;
        return b._estNoNum - a._estNoNum; 
      });
      
      setHistory(data);
      setStaffTasks(localDB.get('staff_tasks'));
      setStaffEntries(localDB.get('staff_ledger'));
      setStaffAttendance(localDB.get('staff_attendance'));
      setStaffProfiles(localDB.get('staff_profiles'));
      setKankotriInventory(localDB.get('kankotri_inventory'));
      setSharedNotes(localDB.get('shared_notes'));
      setDailyExpenses(localDB.get('daily_expenses'));
      setLastSyncTime(new Date());
      setLoading(false);
    };

    loadData();

    const handleDbChange = () => loadData();
    window.addEventListener('db_changed', handleDbChange);

    return () => {
        window.removeEventListener('db_changed', handleDbChange);
    };
  }, [currentDocId, refreshKey]); 

  // --- 6:00 PM AUTO PROMPT CHECK FOR JPG BACKUP & 6:02 PM FOR ROJMEL ---
  useEffect(() => {
      const checkTime = () => {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          
          // 6:00 PM Trigger for JPG Backup
          if (now.getHours() >= 18) {
              if (localStorage.getItem('lastJpgBackupDate') !== todayStr) {
                  setShowJpgPrompt(true);
              }
          }

          // 6:02 PM Trigger for Daily Rojmel Excel
          if ((now.getHours() === 18 && now.getMinutes() >= 2) || now.getHours() > 18) {
              if (localStorage.getItem('lastRojmelBackupDate') !== todayStr) {
                  // Only show auto prompt if Admin is logged in, or remove this condition if you want it to show for everyone
                  if (operatorName === 'Admin') {
                      setShowRojmelPrompt(true);
                  }
              }
          }

          // 6:04 PM Trigger for Full DB Backup (Notes, Stock, Staff)
          if ((now.getHours() === 18 && now.getMinutes() >= 4) || now.getHours() > 18) {
              if (localStorage.getItem('lastFullDbBackupDate') !== todayStr) {
                  if (operatorName === 'Admin') {
                      setShowFullBackupPrompt(true);
                  }
              }
          }
      };
      const intervalId = setInterval(checkTime, 60000);
      checkTime();
      return () => clearInterval(intervalId);
  }, [operatorName]);

  // Clear error message automatically after 5 seconds
  useEffect(() => {
      if (errorMessage) {
          const timer = setTimeout(() => setErrorMessage(''), 5000);
          return () => clearTimeout(timer);
      }
  }, [errorMessage]);
  
  useEffect(() => {
    if (currentDocId && history.length > 0) {
        const currentDoc = history.find(d => d.id === currentDocId);
        if (currentDoc && currentDoc.estNo && currentDoc.estNo !== estNo) {
            setEstNo(currentDoc.estNo);
        }
    }
  }, [currentDocId, history, estNo]);

  const deliveredJobs = useMemo(() => history.filter(row => row.status === 'Delivered' || row.status === 'Delivered but Not Sure' || row.status === 'Pakku Bill' || row.status === 'Tally Entry' || row.status === 'Order Cancel').map(row => ({
      ...row,
      _deliverySortTime: parseDateTime(row.deliveryDate, row.deliveryTime)
  })), [history]);
  const currentJobs = useMemo(() => history.filter(row => row.status !== 'Delivered' && row.status !== 'Delivered but Not Sure' && row.status !== 'Pakku Bill' && row.status !== 'Tally Entry' && row.status !== 'Order Cancel'), [history]);

  const filteredCurrentJobs = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase();
    return currentJobs.filter(row => {
        // Status Filter Check
        if (activeStatusFilter !== 'ALL' && row.status !== activeStatusFilter) {
            return false;
        }

        if(!term) return true;
        const customerMatch = row.customerName?.toLowerCase().includes(term);
        const estNoMatch = row.estNo?.toLowerCase().includes(term);
        const particularMatch = row.items?.some(item => item.particular?.toLowerCase().includes(term));
        const designerMatch = row.designerName?.toLowerCase().includes(term); 
        const printerMatch = row.printingVendor?.toLowerCase().includes(term); 
        
        return customerMatch || estNoMatch || particularMatch || designerMatch || printerMatch;
    });
  }, [currentJobs, deferredSearchTerm, activeStatusFilter]);

  const filteredDeliveredJobs = useMemo(() => {
    const term = deferredDeliveredSearchTerm.toLowerCase();
    return deliveredJobs
        .filter(row => {
            let matchFilter = true;
            if (deliveredFilterType === 'OUTSTANDING') {
                matchFilter = Number(row.outstanding) > 0 && row.status !== 'Order Cancel';
            } else if (deliveredFilterType === 'CANCELLED') {
                matchFilter = row.status === 'Order Cancel';
            } else if (deliveredFilterType === 'TALLY') {
                matchFilter = row.status === 'Tally Entry';
            }

            if(!term) return matchFilter;

            const customerMatch = row.customerName?.toLowerCase().includes(term);
            const estNoMatch = row.estNo?.toLowerCase().includes(term);
            const particularMatch = row.items?.some(item => item.particular?.toLowerCase().includes(term));
            const phoneMatch = row.phone?.includes(term);
            const amountMatch = String(row.totalAmount || '').includes(term);
            
            return (customerMatch || estNoMatch || particularMatch || phoneMatch || amountMatch) && matchFilter;
        })
        .sort((a, b) => {
            // Sort by Delivery Date and Time descending (PERFORMANCE FIX: using pre-calculated values)
            if (b._deliverySortTime !== a._deliverySortTime) return (b._deliverySortTime || 0) - (a._deliverySortTime || 0);

            // Fallback to Estimate Number descending if dates are same
            return (b._estNoNum || 0) - (a._estNoNum || 0);
        });
  }, [deliveredJobs, deferredDeliveredSearchTerm, deliveredFilterType]);

  const calculateStatistics = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    let dailyTotalAmount = 0;
    let totalOutstanding = 0;
    let totalJobs = history.length;
    let deliveredCount = deliveredJobs.length;
    let dailyCash = 0;
    let dailyOnline = 0;
    let dailyDiscount = 0; 
    let dailyTally = 0;
    let dailyNewJobsCount = 0;
    let dailyDeliveredCount = 0;

    history.forEach(row => {
        totalOutstanding += Number(row.outstanding) || 0;
        if (row.date === today) {
            dailyTotalAmount += Number(row.totalAmount) || 0;
            dailyNewJobsCount++;
        }

        if ((row.status === 'Delivered' || row.status === 'Pakku Bill' || row.status === 'Tally Entry') && row.deliveryDate === today) {
            dailyDeliveredCount++;
        }

        if (row.payments && Array.isArray(row.payments)) {
            row.payments.forEach(p => {
                if (p.date === today) {
                    if (p.mode === 'CASH') dailyCash += Number(p.amount);
                    else if (p.mode === 'DISCOUNT') dailyDiscount += Number(p.amount); 
                    else if (p.mode === 'TALLY ENTRY') dailyTally += Number(p.amount);
                    else dailyOnline += Number(p.amount);
                }
            });
        }
    });

    return {
        dailyTotalAmount: dailyTotalAmount.toFixed(2),
        totalOutstanding: totalOutstanding.toFixed(2),
        totalJobs: totalJobs,
        deliveredCount: deliveredCount,
        dailyCash: dailyCash.toFixed(2),
        dailyOnline: dailyOnline.toFixed(2),
        dailyDiscount: dailyDiscount.toFixed(2),
        dailyTally: dailyTally.toFixed(2),
        dailyCollectionTotal: (dailyCash + dailyOnline).toFixed(2),
        dailyNewJobsCount,
        dailyDeliveredCount
    };
  }, [history, deliveredJobs.length]);

  const stats = useMemo(() => calculateStatistics(), [calculateStatistics]);
  const { dailyTotalAmount, totalOutstanding, totalJobs, deliveredCount, dailyCash, dailyOnline, dailyDiscount, dailyCollectionTotal } = stats;

  const customerStats = useMemo(() => {
      if (!customerName || customerName.trim() === '') return null;
      
      const existingJobs = history.filter(h => h.customerName?.trim().toUpperCase() === customerName.trim().toUpperCase());
      if (existingJobs.length === 0) return null;

      let totalBilled = 0;
      let totalOutstanding = 0;
      
      existingJobs.forEach(j => {
          if (j.status !== 'Order Cancel') { 
              totalBilled += Number(j.totalAmount) || 0;
              totalOutstanding += Number(j.outstanding) || 0;
          }
      });
      
      const totalPaid = totalBilled - totalOutstanding;
      
      const activeJobs = existingJobs
          .filter(j => !['Delivered', 'Pakku Bill', 'Tally Entry', 'Order Cancel'].includes(j.status))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { totalBilled, totalPaid, totalOutstanding, activeJobs };
  }, [customerName, history]);

  const handleSendDailyReport = () => {
        const statsData = calculateStatistics();
        const todayStr = new Date().toLocaleDateString('en-IN');
        const todayIso = new Date().toISOString().split('T')[0];
        
        let todayExpenseAmountRaw = 0;
        let todayStaffPettyCash = 0;
        dailyExpenses.forEach(e => {
            if (e.date === todayIso) {
                todayExpenseAmountRaw += Number(e.amount);
                if (e.category === 'કારીગર ખર્ચ / એડવાન્સ (Staff Petty Cash)') {
                    todayStaffPettyCash += Number(e.amount);
                }
            }
        });
        const todayExpenseAmount = todayExpenseAmountRaw - todayStaffPettyCash;

        const netCash = Number(stats.dailyCash) - todayExpenseAmount;
        
        let msg = `*📊 DAILY REPORT - MOHAMMADI PRESS*\n`;
        msg += `📅 Date: ${todayStr}\n\n`;
        
        msg += `*📌 NEW BUSINESS (નવું કામ):*\n`;
        msg += `📝 Total Jobs: ${statsData.dailyNewJobsCount}\n`;
        msg += `💰 Total Amt: ₹${statsData.dailyTotalAmount}\n\n`;
        
        msg += `*💵 COLLECTION (આજની આવક):*\n`;
        msg += `💵 Cash: ₹${stats.dailyCash}\n`;
        msg += `📱 Online: ₹${stats.dailyOnline}\n`;
        if (Number(stats.dailyDiscount) > 0) {
            msg += `🎁 Discount: ₹${stats.dailyDiscount}\n`;
        }
        if (Number(stats.dailyTally) > 0) {
            msg += `📓 Tally Entry: ₹${stats.dailyTally}\n`;
        }
        msg += `✅ *Total Collection: ₹${stats.dailyCollectionTotal}*\n\n`;
        
        msg += `*📉 EXPENSES (આજનો ખર્ચ):*\n`;
        msg += `💸 Expenses: ₹${todayExpenseAmount.toFixed(2)}\n`;
        msg += `------------------\n`;
        msg += `🏦 *Net Cash (ગલ્લામાં રોકડ): ₹${netCash.toFixed(2)}*\n\n`;

        msg += `*📦 DELIVERY (આપેલ કામ):*\n`;
        msg += `🚚 Jobs Delivered: ${stats.dailyDeliveredCount}\n\n`;
        
        msg += `Good Night! 🌙`;
        
        const url = `whatsapp://send?phone=919825547625&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
  };

  const handleExportAndShareRojmel = async () => {
      try {
          setImporting(true);
          const XLSX = await loadXLSX();
          const today = new Date().toISOString().split('T')[0];
          const displayDate = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'}).replace(/\//g, '-');

          // 1. Data for New Jobs
          const todayJobs = history.filter(h => h.date === today);
          const jobsData = todayJobs.map((j, i) => ({
              'No': i + 1,
              'Est No': j.estNo,
              'Time': j.time || '',
              'Customer': j.customerName,
              'Items': j.items?.map(it => it.particular).join(', '),
              'Total Amount': Number(j.totalAmount),
              'Advance': Number(j.advance),
              'Outstanding': Number(j.outstanding)
          }));

          // 2. Data for Collections
          const periodPayments = history.flatMap(h => {
              const jobPayments = (h.payments && h.payments.length > 0) 
                  ? h.payments 
                  : (Number(h.advance) > 0 ? [{amount: Number(h.advance), mode: h.advanceMode || 'CASH', date: h.date, addedAt: h.createdAt ? new Date(h.createdAt.seconds * 1000).toISOString() : null}] : []);
              return jobPayments.map(p => ({
                  ...p,
                  estNo: h.estNo,
                  customerName: h.customerName
              }));
          }).filter(p => p.date === today);

          const collectionsData = periodPayments.map((p, i) => {
              let timeStr = '';
              if (p.addedAt) {
                  timeStr = new Date(p.addedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              }
              return {
                  'No': i + 1,
                  'Est No': p.estNo,
                  'Time': timeStr,
                  'Customer': p.customerName,
                  'Mode': p.mode,
                  'Amount': Number(p.amount)
              };
          });

          const wb = XLSX.utils.book_new();
          
          const wsJobs = XLSX.utils.json_to_sheet(jobsData.length ? jobsData : [{'Message': 'No new jobs today'}]);
          const wsCollections = XLSX.utils.json_to_sheet(collectionsData.length ? collectionsData : [{'Message': 'No collections today'}]);

          // Adjust column widths
          wsJobs['!cols'] = [{wch: 5}, {wch: 12}, {wch: 12}, {wch: 30}, {wch: 40}, {wch: 15}, {wch: 15}, {wch: 15}];
          wsCollections['!cols'] = [{wch: 5}, {wch: 12}, {wch: 12}, {wch: 30}, {wch: 15}, {wch: 15}];

          XLSX.utils.book_append_sheet(wb, wsJobs, "Today New Jobs");
          XLSX.utils.book_append_sheet(wb, wsCollections, "Today Collections");

          // Download file
          XLSX.writeFile(wb, `Daily_Rojmel_${displayDate}.xlsx`);

          // Mark as done
          localStorage.setItem('lastRojmelBackupDate', today);
          setShowRojmelPrompt(false);
          setImporting(false);

          // Open WhatsApp with summary text
          handleSendDailyReport();

      } catch (error) {
          console.error("Rojmel Export Error:", error);
          alert("રોજમેળ ની Excel ફાઈલ બનાવવામાં ભૂલ થઈ. ઇન્ટરનેટ ચેક કરો.");
          setImporting(false);
      }
  };

  const handleFullDatabaseBackup = async (isAuto = false) => {
      try {
          setImporting(true);
          const XlsxPopulate = await loadXlsxPopulate();
          const today = new Date().toISOString().split('T')[0];
          const displayDate = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'}).replace(/\//g, '-');

          const workbook = await XlsxPopulate.fromBlankAsync();
          
          const sheetRegister = workbook.sheet(0);
          sheetRegister.name("Register");
          
          const sortedHistory = [...history].sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              if (dateA !== dateB) return dateA - dateB;

              const numA = parseInt(a.estNo.replace(/\D/g, '')) || 0;
              const numB = parseInt(b.estNo.replace(/\D/g, '')) || 0;
              return numA - numB;
          });

          let maxItemsCount = 1;
          sortedHistory.forEach(row => {
              if (row.items && row.items.length > maxItemsCount) {
                  maxItemsCount = row.items.length;
              }
          });

          const regHeaders = ['Es Nos.', 'Date', 'Customer Name', 'MOBILE NUMBER'];
          for(let i=1; i<=maxItemsCount; i++) {
              regHeaders.push(`ITEM ${i} NAME`);
              regHeaders.push(`ITEM ${i} QTY`);
              regHeaders.push(`ITEM ${i} AMT`);
          }
          regHeaders.push('TOTAL AMOUNT', 'CASH RECEIVED', 'ONLINE/BANK RECEIVED', 'DISCOUNT', 'OUTSTANDING', 'STATUS', 'OPERATOR');

          regHeaders.forEach((h, i) => {
              sheetRegister.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true });
          });

          let currentRow = 2;
          let totalAmountSum = 0;
          let totalCashSum = 0;
          let totalOnlineSum = 0;
          let totalDiscountSum = 0; 
          let totalOutstandingSum = 0;

          sortedHistory.forEach((row) => {
              let cashAmt = 0;
              let onlineAmt = 0;
              let discountAmt = 0; 

              if (row.payments && row.payments.length > 0) {
                  row.payments.forEach(p => {
                      if (p.mode === 'CASH') cashAmt += Number(p.amount);
                      else if (p.mode === 'DISCOUNT') discountAmt += Number(p.amount); 
                      else onlineAmt += Number(p.amount);
                  });
              } else if (Number(row.advance) > 0) {
                  if (row.advanceMode === 'CASH') cashAmt = Number(row.advance);
                  else if (row.advanceMode === 'DISCOUNT') discountAmt = Number(row.advance);
                  else onlineAmt = Number(row.advance);
              }
              
              const currentTotal = Number(row.totalAmount) || 0;
              const currentOutstanding = Number(row.outstanding) || 0;
              
              totalAmountSum += currentTotal;
              totalCashSum += cashAmt;
              totalOnlineSum += onlineAmt;
              totalDiscountSum += discountAmt;
              totalOutstandingSum += currentOutstanding;

              sheetRegister.cell(currentRow, 1).value(row.estNo);
              sheetRegister.cell(currentRow, 2).value(formatDateForExcel(row.date));
              sheetRegister.cell(currentRow, 3).value((row.customerName || '').toUpperCase());
              sheetRegister.cell(currentRow, 4).value(row.phone);
              
              let currentCol = 5;
              for(let i=0; i<maxItemsCount; i++) {
                  if (row.items && row.items[i]) {
                      sheetRegister.cell(currentRow, currentCol++).value(row.items[i].particular || '');
                      sheetRegister.cell(currentRow, currentCol++).value(row.items[i].qty || 1);
                      sheetRegister.cell(currentRow, currentCol++).value(Number(row.items[i].amount) || 0);
                  } else {
                      sheetRegister.cell(currentRow, currentCol++).value('');
                      sheetRegister.cell(currentRow, currentCol++).value('');
                      sheetRegister.cell(currentRow, currentCol++).value('');
                  }
              }

              sheetRegister.cell(currentRow, currentCol++).value(currentTotal);
              sheetRegister.cell(currentRow, currentCol++).value(cashAmt > 0 ? cashAmt : '');
              sheetRegister.cell(currentRow, currentCol++).value(onlineAmt > 0 ? onlineAmt : '');
              sheetRegister.cell(currentRow, currentCol++).value(discountAmt > 0 ? discountAmt : '');
              sheetRegister.cell(currentRow, currentCol++).value(currentOutstanding);
              sheetRegister.cell(currentRow, currentCol++).value(row.status || '');
              sheetRegister.cell(currentRow, currentCol++).value(row.operatorName);

              if (row.status === 'Delivered') {
                  sheetRegister.range(currentRow, 1, currentRow, regHeaders.length).style("fill", "C6EFCE"); 
              } else if (row.status === 'Pakku Bill') {
                  sheetRegister.range(currentRow, 1, currentRow, regHeaders.length).style("fill", "CCE5FF"); 
              } else if (row.status === 'Tally Entry') {
                  sheetRegister.range(currentRow, 1, currentRow, regHeaders.length).style("fill", "B2DFEE");
              }
              if (currentOutstanding > 0) {
                  sheetRegister.cell(currentRow, regHeaders.indexOf('OUTSTANDING') + 1).style({ fontColor: "FF0000", bold: true });
              }
              currentRow++;
          });
          
          let totalColStart = regHeaders.indexOf('TOTAL AMOUNT') + 1;
          sheetRegister.cell(currentRow, totalColStart - 1).value("TOTAL").style({ bold: true, horizontalAlignment: "right" });
          sheetRegister.cell(currentRow, totalColStart).value(totalAmountSum).style({ bold: true });
          sheetRegister.cell(currentRow, totalColStart + 1).value(totalCashSum).style({ bold: true });
          sheetRegister.cell(currentRow, totalColStart + 2).value(totalOnlineSum).style({ bold: true });
          sheetRegister.cell(currentRow, totalColStart + 3).value(totalDiscountSum).style({ bold: true });
          sheetRegister.cell(currentRow, totalColStart + 4).value(totalOutstandingSum).style({ bold: true, fontColor: "FF0000" });
          
          sheetRegister.range(currentRow, 1, currentRow, regHeaders.length).style({ border: true, fill: "F2F2F2" });
          if(currentRow > 2) {
              sheetRegister.range(1, 1, currentRow - 1, regHeaders.length).autoFilter(); 
          }
          
          // Adjust columns width for Register
          sheetRegister.column(1).width(12);
          sheetRegister.column(2).width(15);
          sheetRegister.column(3).width(35);
          sheetRegister.column(4).width(15);
          let colIdx = 5;
          for(let i=0; i<maxItemsCount; i++) {
              sheetRegister.column(colIdx++).width(30);
              sheetRegister.column(colIdx++).width(10);
              sheetRegister.column(colIdx++).width(12);
          }
          sheetRegister.column(colIdx++).width(15);
          sheetRegister.column(colIdx++).width(15);
          sheetRegister.column(colIdx++).width(20);
          sheetRegister.column(colIdx++).width(12);
          sheetRegister.column(colIdx++).width(15);
          sheetRegister.column(colIdx++).width(20);
          sheetRegister.column(colIdx++).width(15);

          // 1. Notes Data
          const sheetNotes = workbook.addSheet("Notes");
          const notesHeaders = ['Text', 'Important', 'Status', 'Created By', 'Created At', 'Completed By', 'Completed At'];
          notesHeaders.forEach((h, i) => sheetNotes.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true }));
          let nRow = 2;
          sharedNotes.forEach(n => {
              sheetNotes.cell(nRow, 1).value(n.text || '');
              sheetNotes.cell(nRow, 2).value(n.isImportant ? 'Yes' : 'No');
              sheetNotes.cell(nRow, 3).value(n.isDone ? 'Done' : 'Active');
              sheetNotes.cell(nRow, 4).value(n.createdBy || '');
              sheetNotes.cell(nRow, 5).value(n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : '');
              sheetNotes.cell(nRow, 6).value(n.completedBy || '');
              sheetNotes.cell(nRow, 7).value(n.completedAt ? new Date(n.completedAt).toLocaleString('en-IN') : '');
              nRow++;
          });
          sheetNotes.column(1).width(40);
          sheetNotes.column(2).width(12);
          sheetNotes.column(3).width(12);
          sheetNotes.column(4).width(15);
          sheetNotes.column(5).width(20);
          sheetNotes.column(6).width(15);
          sheetNotes.column(7).width(20);

          // 2. Stock Data
          const sheetStock = workbook.addSheet("Stock");
          const stockHeaders = ['Kankotri No', 'Stock'];
          stockHeaders.forEach((h, i) => sheetStock.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true }));
          let sRow = 2;
          kankotriInventory.forEach(k => {
              sheetStock.cell(sRow, 1).value(k.kankotriNo || '');
              sheetStock.cell(sRow, 2).value(Number(k.stock) || 0);
              sRow++;
          });
          sheetStock.column(1).width(20);
          sheetStock.column(2).width(15);

          // 3. Staff Profiles
          const sheetProfiles = workbook.addSheet("Staff Profiles");
          const profHeaders = ['Staff Name', 'Daily Wage'];
          profHeaders.forEach((h, i) => sheetProfiles.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true }));
          let pRow = 2;
          staffProfiles.forEach(p => {
              sheetProfiles.cell(pRow, 1).value(p.staffName || '');
              sheetProfiles.cell(pRow, 2).value(Number(p.dailyWage) || 0);
              pRow++;
          });
          sheetProfiles.column(1).width(25);
          sheetProfiles.column(2).width(15);

          // 4. Staff Attendance
          const sheetAtt = workbook.addSheet("Attendance");
          const attHeaders = ['Date', 'Staff Name', 'Status', 'In Time', 'Out Time', 'Overtime (Hrs)', 'Note'];
          attHeaders.forEach((h, i) => sheetAtt.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true }));
          let aRow = 2;
          staffAttendance.forEach(a => {
              sheetAtt.cell(aRow, 1).value(a.date || '');
              sheetAtt.cell(aRow, 2).value(a.staffName || '');
              sheetAtt.cell(aRow, 3).value(a.status || '');
              sheetAtt.cell(aRow, 4).value(a.inTime || '');
              sheetAtt.cell(aRow, 5).value(a.outTime || '');
              sheetAtt.cell(aRow, 6).value(a.overtime || '');
              sheetAtt.cell(aRow, 7).value(a.note || '');
              aRow++;
          });
          sheetAtt.column(1).width(15);
          sheetAtt.column(2).width(25);
          sheetAtt.column(3).width(15);
          sheetAtt.column(4).width(15);
          sheetAtt.column(5).width(15);
          sheetAtt.column(6).width(15);
          sheetAtt.column(7).width(30);

          // 5. Staff Ledger
          const sheetLedger = workbook.addSheet("Ledger");
          const ledHeaders = ['Date', 'Staff Name', 'Type', 'Amount', 'Note'];
          ledHeaders.forEach((h, i) => sheetLedger.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true }));
          let lRow = 2;
          staffEntries.forEach(e => {
              sheetLedger.cell(lRow, 1).value(e.date || '');
              sheetLedger.cell(lRow, 2).value(e.staffName || '');
              sheetLedger.cell(lRow, 3).value(e.ledgerType === 'EXTRA' ? 'Extra Work/OT' : 'Advance/Upad');
              sheetLedger.cell(lRow, 4).value(Number(e.amount) || 0);
              sheetLedger.cell(lRow, 5).value(e.note || '');
              lRow++;
          });
          sheetLedger.column(1).width(15);
          sheetLedger.column(2).width(25);
          sheetLedger.column(3).width(20);
          sheetLedger.column(4).width(15);
          sheetLedger.column(5).width(30);

          // 6. Staff Tasks (Work Diary)
          const sheetTasks = workbook.addSheet("Tasks");
          const taskHeaders = ['Date', 'Staff Name', 'Task Detail', 'Status', 'Completion Note'];
          taskHeaders.forEach((h, i) => sheetTasks.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true }));
          let tRow = 2;
          staffTasks.forEach(t => {
              sheetTasks.cell(tRow, 1).value(t.assignedDate || '');
              sheetTasks.cell(tRow, 2).value(t.staffName || '');
              sheetTasks.cell(tRow, 3).value(t.taskDetail || '');
              sheetTasks.cell(tRow, 4).value(t.status || '');
              sheetTasks.cell(tRow, 5).value(t.completionNote || '');
              tRow++;
          });
          sheetTasks.column(1).width(15);
          sheetTasks.column(2).width(25);
          sheetTasks.column(3).width(40);
          sheetTasks.column(4).width(15);
          sheetTasks.column(5).width(30);

          // 7. Daily Expenses
          const sheetExpenses = workbook.addSheet("Daily Expenses");
          const expHeaders = ['Date', 'Category', 'Description', 'Amount'];
          expHeaders.forEach((h, i) => sheetExpenses.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true }));
          let exRow = 2;
          const sortedExpenses = [...dailyExpenses].sort((a,b) => new Date(a.date) - new Date(b.date));
          sortedExpenses.forEach(e => {
              sheetExpenses.cell(exRow, 1).value(e.date || '');
              sheetExpenses.cell(exRow, 2).value(e.category || '');
              sheetExpenses.cell(exRow, 3).value(e.description || '');
              sheetExpenses.cell(exRow, 4).value(Number(e.amount) || 0);
              exRow++;
          });
          sheetExpenses.column(1).width(15);
          sheetExpenses.column(2).width(30);
          sheetExpenses.column(3).width(40);
          sheetExpenses.column(4).width(15);

          // Generate Blob and Download
          const blob = await workbook.outputAsync(); 
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          document.body.appendChild(a);
          a.href = url;
          a.download = `Mohammadi_Press_Full_DB_${displayDate}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          if (isAuto) {
              localStorage.setItem('lastFullDbBackupDate', today);
              setShowFullBackupPrompt(false);
          }
          
          setImporting(false);
          if (!isAuto) alert("✅ Full Database Backup (All Data) ડાઉનલોડ થઈ ગયું છે.");

      } catch (error) {
          console.error("Full Backup Error:", error);
          alert("બેકઅપ ફાઈલ બનાવવામાં ભૂલ થઈ. ઇન્ટરનેટ ચેક કરો.");
          setImporting(false);
      }
  };

  const handleSaveAllAsPDF = async (targetDate) => {
      const jobsToExport = targetDate ? history.filter(j => j.date === targetDate) : history;
      if (jobsToExport.length === 0) {
          alert("આ તારીખ નો કોઈ ડેટા ઉપલબ્ધ નથી.");
          return;
      }
      
      setExportJobs(jobsToExport);
      setPrintingAll(true);
      setIsAutoDownloading(true);

      try {
          const html2pdf = await loadHtml2Pdf();
          
          setTimeout(() => {
              const element = document.getElementById('print-all-container');
              if (!element) {
                  setIsAutoDownloading(false);
                  setPrintingAll(false);
                  setExportJobs([]);
                  return;
              }

              const dateStr = targetDate || new Date().toISOString().split('T')[0];
              const opt = {
                margin:       0,
                filename:     `Estimates_${dateStr}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a5', orientation: 'landscape' }
              };

              html2pdf().set(opt).from(element).save().then(() => {
                  setIsAutoDownloading(false);
                  setPrintingAll(false);
                  setExportJobs([]);
                  alert("✅ PDF ઓટોમેટિક ડાઉનલોડ થઈ ગઈ છે!");
              }).catch(err => {
                  console.error("PDF Error:", err);
                  alert("PDF બનાવવામાં ભૂલ થઈ. કદાચ ડેટા ખૂબ વધારે છે.");
                  setIsAutoDownloading(false);
                  setPrintingAll(false);
                  setExportJobs([]);
              });
          }, 1500); 

      } catch (err) {
          console.error("Library Error:", err);
          alert("PDF Library લોડ કરવામાં નિષ્ફળતા. ઇન્ટરનેટ ચેક કરો.");
          setIsAutoDownloading(false);
          setPrintingAll(false);
          setExportJobs([]);
      }
  };

  const handleSaveAllAsJPGZip = async (targetDate) => {
      const jobsToExport = targetDate ? history.filter(j => j.date === targetDate) : history;
      if (jobsToExport.length === 0) return alert('આ તારીખ નો કોઈ ડેટા ઉપલબ્ધ નથી.');
      
      setExportJobs(jobsToExport);
      setJpgProgress({ current: 0, total: jobsToExport.length, isGenerating: true });
      setPrintingAll(true); 
      
      try {
          const html2canvas = await loadHtml2Canvas();
          const JSZip = await loadJSZip();
          
          await new Promise(r => setTimeout(r, 1500)); // Wait for React to render full list
          
          const zip = new JSZip();
          const dateStr = targetDate || new Date().toISOString().split('T')[0];
          const folderName = `Mohammadi_Press_${dateStr}`;
          const imgFolder = zip.folder(folderName);
          
          const container = document.getElementById('print-all-container');
          if (!container) throw new Error("Container not found");
          
          const children = container.children;
          
          for (let i = 0; i < jobsToExport.length; i++) {
              const job = jobsToExport[i];
              const childNode = children[i];
              if (childNode) {
                  const canvas = await html2canvas(childNode, { 
                      scale: 2, 
                      useCORS: true, 
                      logging: false,
                      backgroundColor: '#ffffff'
                  });
                  const imgData = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                  const safeCustName = (job.customerName || 'Unknown').replace(/[^a-z0-9]/gi, '_');
                  imgFolder.file(`${job.estNo}_${safeCustName}.jpg`, imgData, {base64: true});
              }
              setJpgProgress({ current: i + 1, total: jobsToExport.length, isGenerating: true });
          }
          
          const content = await zip.generateAsync({ type: "blob" });
          const url = window.URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${folderName}.zip`; 
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          
          if (!targetDate || targetDate === new Date().toISOString().split('T')[0]) {
              localStorage.setItem('lastJpgBackupDate', new Date().toISOString().split('T')[0]);
          }
          setShowJpgPrompt(false);
          alert(`✅ ફોલ્ડર (ZIP) સફળતાપૂર્વક ડાઉનલોડ થઈ ગયું છે. (${jobsToExport.length} ઈમેજ)`);
          
      } catch (err) {
          console.error("JPG Error:", err);
          alert("JPG બનાવવામાં ભૂલ થઈ. ઇન્ટરનેટ કનેક્શન તપાસો.");
      } finally {
          setPrintingAll(false);
          setExportJobs([]);
          setJpgProgress({ current: 0, total: 0, isGenerating: false });
      }
  };

  const handleNewEstimate = () => {
      setCurrentDocId(null); 
      setCustomerName('');
      setPhone('');
      setItems([{ id: Date.now(), particular: '', detail: '', qty: 1, rate: 0, amount: 0, isDelivered: false }]);
      
      setOriginalItems([]);
      setOriginalStatus('Order Placed Successfully');
      
      setPayments([]);
      setPayAmount('');
      setPayMode('CASH');
      setPayDate(new Date().toISOString().split('T')[0]);
      
      setDate(new Date().toISOString().split('T')[0]);

      setProofDate('');
      setProofDays('');
      setDeliveryTime('');
      setDeliveryDate(''); 
      setStatus('Order Placed Successfully');
      setDesignerName(''); 
      setPrintingVendor(''); 
      setCancelReason(''); 
      setLlmFeedback({});
      setErrorMessage('');
  };

  // --- NEW: Duplicate (Repeat) Order Function ---
  const handleDuplicateEstimate = (e, row) => {
    if (e) e.stopPropagation(); 
    
    // Copy Customer details
    setCustomerName(row.customerName || '');
    setPhone(row.phone || '');
    
    // Copy Items (with new IDs, reset delivered status)
    const copiedItems = (row.items || []).map((item, index) => ({
        ...item,
        id: Date.now() + index,
        isDelivered: false,
        authorityReceived: false
    }));
    setItems(copiedItems.length > 0 ? copiedItems : [{ id: Date.now(), particular: '', detail: '', qty: 1, rate: 0, amount: 0, isDelivered: false }]);
    
    setOriginalItems([]);
    setOriginalStatus('Order Placed Successfully');
    
    // Reset Process info & Dates to current/default
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setStatus('Order Placed Successfully'); 
    setDesignerName(''); 
    setPrintingVendor(''); 
    setCancelReason(''); 
    
    setProofDate(''); 
    setProofDays(row.proofDays || ''); 
    setDeliveryTime(row.deliveryTime || '');
    setDeliveryDate(''); 
    
    // Clear payments (fresh order)
    setPayments([]);
    setPayAmount(''); 
    setPayMode('CASH');
    setPayDate(new Date().toISOString().split('T')[0]);
    
    // Clear document ID so it creates a NEW document instead of updating old one
    setCurrentDocId(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrorMessage('');
    
    alert("Juni mahiti copy zali aahe. Naveen entry sathi details check kara ani 'SAVE' var click kara. (Details copied for Repeat Order!)");
  };

  const calculateTotal = useCallback((currentItems) => currentItems.reduce((sum, item) => sum + Number(item.amount), 0), []);
  const totalAmount = useMemo(() => calculateTotal(items), [items, calculateTotal]);
  
  const totalAdvance = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount), 0), [payments]);
  const outstanding = useMemo(() => totalAmount - totalAdvance, [totalAmount, totalAdvance]);

  const handleAddPayment = () => {
      const amount = parseFloat(payAmount); 
      if (isNaN(amount) || amount <= 0) {
          alert("Please enter a valid amount (રકમ બરાબર નાખો)");
          return;
      }
      const newPayment = {
          id: Date.now(),
          amount: amount,
          mode: payMode,
          date: payDate,
          addedAt: new Date().toISOString()
      };
      setPayments([...payments, newPayment]);
      setPayAmount(''); 
  };

  const handleDeletePayment = (id) => {
      setPayments(payments.filter(p => p.id !== id));
  };

  const handleOperatorChange = (e) => {
      const val = e.target.value;
      setOperatorName(val);
      localStorage.setItem('operatorName', val); 
  };

  const handleItemChange = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id !== id) return item;
      
      let updates = { ...item, [field]: value };
      
      if (field === 'particular') {
          updates.detail = ''; 
      }

      const qty = Number(updates.qty) || 0;
      const rate = Number(updates.rate) || 0;
      const amount = Number(updates.amount) || 0;

      if (field === 'qty' || field === 'rate') updates.amount = (qty * rate).toFixed(2);
      else if (field === 'amount') updates.rate = qty > 0 ? (amount / qty).toFixed(2) : '0.00';
      
      return updates;
    });
    
    setItems(newItems);

    if (field === 'particular' || field === 'detail') {
        setLlmFeedback(prev => { const n = {...prev}; delete n[id]; return n; });
    }
  };

  const addItem = () => setItems([...items, { id: Date.now(), particular: '', detail: '', qty: 1, rate: 0, amount: 0, isDelivered: false }]);
  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const handleImportClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.name.match(/\.(xlsx|xls)$/)) {
          setErrorMessage("ફક્ત Excel ફાઈલ (.xlsx અથવા .xls) જ અપલોડ કરો.");
          e.target.value = ''; 
          return;
      }

      setImporting(true);
      setErrorMessage('');

      try {
          const XLSX = await loadXLSX();
          
          const reader = new FileReader();
          reader.onload = async (evt) => {
              try {
                  const bstr = evt.target.result;
                  const workbook = XLSX.read(bstr, { type: 'binary' });
                  
                  let importSummary = [];
                  
                  // Helper function for Date parsing (ROBUST)
                  const parseExcelDate = (dateVal) => {
                      if (!dateVal) return new Date().toISOString().split('T')[0];
                      if (typeof dateVal === 'number') {
                         const dateObj = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                         const y = dateObj.getUTCFullYear();
                         const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                         const d = String(dateObj.getUTCDate()).padStart(2, '0');
                         return `${y}-${m}-${d}`;
                      }
                      const strVal = String(dateVal).trim();
                      if (strVal.match(/^\d{7,8}$/)) {
                           const s = strVal.padStart(8, '0'); 
                           const d = s.substring(0, 2);
                           const m = s.substring(2, 4);
                           const y = s.substring(4, 8);
                           return `${y}-${m}-${d}`; 
                      }
                      const parts = strVal.split(/[-/]/);
                      if (parts.length === 3) {
                          if (parts[0].length === 4) {
                              const d = new Date(strVal);
                              if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                          } else if (parts[2].length === 4) {
                              const formatted = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                              const d = new Date(formatted);
                              if (!isNaN(d.getTime())) return formatted;
                          }
                      }
                      const parsed = new Date(dateVal);
                      if (!isNaN(parsed.getTime())) {
                          return parsed.toISOString().split('T')[0];
                      }
                      return new Date().toISOString().split('T')[0];
                  };

                  // Helper for DateTime (ISO) parsing safely (For Notes)
                  const parseDateTimeISO = (val) => {
                      if (!val) return null;
                      const str = String(val).trim();
                      let d = new Date(str);
                      if (!isNaN(d.getTime())) return d.toISOString();
                      
                      const parts = str.split(',')[0].split('/');
                      if (parts.length === 3) {
                          const iso = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}T12:00:00Z`;
                          d = new Date(iso);
                          if (!isNaN(d.getTime())) return d.toISOString();
                      }
                      return null;
                  };

                  // Process all sheets dynamically
                  for (const sheetName of workbook.SheetNames) {
                      try {
                          const ws = workbook.Sheets[sheetName];
                          const data = XLSX.utils.sheet_to_json(ws);
                          const lowerSheetName = sheetName.toLowerCase();

                          if (data.length > 0) {
                              let importedCount = 0;
                              
                              // 1. Process "Register" (Estimates)
                              if (lowerSheetName.includes('register') || lowerSheetName.includes('estimate') || lowerSheetName.includes('today')) {
                                  const today = new Date();
                                  const isNewFinancialYear = today >= new Date('2026-04-01T00:00:00');
                                  const currentPrefix = isNewFinancialYear ? 'M-' : 'ES-';

                                  let currentMaxId = 0;
                                  history.forEach(d => {
                                    if (d.estNo?.startsWith(currentPrefix)) {
                                        const numPart = parseInt(d.estNo.replace(currentPrefix, '') || '0');
                                        if (numPart > currentMaxId) currentMaxId = numPart;
                                    }
                                  });

                                  for (let i = 0; i < data.length; i++) {
                                      const row = data[i];
                                      const getVal = (keys) => {
                                          const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
                                          return key ? row[key] : '';
                                      };

                                      const dateVal = getVal(['date', 'tariqh', 'dt']);
                                      if (!dateVal && !getVal(['est no', 'customer name'])) continue; 
                                      
                                      let formattedDate = parseExcelDate(dateVal);

                                      let ph = getVal(['phone', 'mobile', 'mo', 'mobile no', 'mobile number', 'phone number', 'contact', 'contact number', 'whatsapp', 'wp', 'whatsapp no', 'ph', 'm.no']) || '';
                                      let custName = getVal(['customer name', 'customer', 'party name', 'name', 'party']);
                                      
                                      if ((!ph || String(ph).trim() === '') && custName) {
                                           const existing = history.find(h => 
                                               h.customerName?.trim().toLowerCase() === String(custName).trim().toLowerCase() && 
                                               h.phone && h.phone.length > 5
                                           );
                                           if (existing) ph = existing.phone;
                                      }
                                      
                                      if ((!custName || String(custName).trim() === '') && ph) {
                                           const existing = history.find(h => 
                                               h.phone === String(ph) && 
                                               h.customerName && String(h.customerName).trim() !== ''
                                           );
                                           if (existing) custName = existing.customerName;
                                      }
                                      
                                      if (!custName) custName = 'Unknown';
                                      
                                      const detailVal = getVal(['detail', 'details', 'note', 'remarks']) || '';
                                      const total = Number(getVal(['total amount', 'total', 'amount']) || 0);
                                      
                                      let adv = Number(getVal(['advance', 'paid', 'jama', 'received']) || 0);
                                      const cashRcvd = Number(getVal(['cash received']) || 0);
                                      const onlineRcvd = Number(getVal(['online/bank received']) || 0);
                                      const discountRcvd = Number(getVal(['discount']) || 0);
                                      if (cashRcvd || onlineRcvd || discountRcvd) {
                                          adv = cashRcvd + onlineRcvd + discountRcvd;
                                      }

                                      const statusVal = getVal(['status']) || 'Order Placed Successfully';
                                      const estNoVal = getVal(['est no', 'est. no.', 'no', 'no.', 'bill no', 'bill number', 'estimate no', 'es nos.', 'es nos', 'es no.']);
                                      const operatorVal = getVal(['operator', 'operator name']) || operatorName || 'Admin';

                                      const rawOutstanding = getVal(['outstanding', 'baaki', 'baki', 'pending', 'due']);
                                      let finalAdvance = adv;
                                      let finalOutstanding = 0;

                                      if (rawOutstanding !== '' && rawOutstanding !== undefined && rawOutstanding !== null) {
                                          finalOutstanding = Number(rawOutstanding);
                                          finalAdvance = total - finalOutstanding; 
                                      } else {
                                          finalOutstanding = total - finalAdvance;
                                      }

                                      let finalEstNo;
                                      if (estNoVal !== undefined && estNoVal !== null && String(estNoVal).trim() !== '') {
                                          finalEstNo = String(estNoVal).trim();
                                          if (finalEstNo.startsWith(currentPrefix)) {
                                              const importedNum = parseInt(finalEstNo.replace(/[^0-9]/g, '') || '0');
                                              if (importedNum > currentMaxId) currentMaxId = importedNum;
                                          }
                                      } else {
                                          currentMaxId++;
                                          finalEstNo = `${currentPrefix}${String(currentMaxId).padStart(3, '0')}`;
                                      }

                                      let importedItems = [];
                                      for (let j = 1; j <= 10; j++) {
                                          const part = getVal([`item ${j} name`, `item ${j}`, `particular ${j}`, `particulars ${j}`]);
                                          if (part) {
                                              const qty = Number(getVal([`item ${j} qty`, `qty ${j}`]) || 1);
                                              const amt = Number(getVal([`item ${j} amt`, `amount ${j}`, `amt ${j}`, `rate ${j}`]) || 0);
                                              importedItems.push({
                                                  id: Date.now() + i + j,
                                                  particular: String(part),
                                                  detail: j === 1 ? detailVal : '',
                                                  qty: qty,
                                                  rate: qty > 0 ? (amt / qty).toFixed(2) : '0.00',
                                                  amount: amt.toFixed(2),
                                                  isDelivered: statusVal === 'Delivered' || statusVal === 'Pakku Bill' || statusVal === 'Tally Entry'
                                              });
                                          }
                                      }

                                      if (importedItems.length === 0) {
                                          const particularStr = getVal(['particular', 'particulars', 'item', 'items', 'description', 'items']) || '';
                                          if (particularStr && typeof particularStr === 'string' && particularStr.includes(',')) {
                                              const parts = particularStr.split(',').map(s => s.trim()).filter(Boolean);
                                              const splitAmt = total / parts.length;
                                              importedItems = parts.map((p, idx) => ({
                                                  id: Date.now() + i + idx,
                                                  particular: p,
                                                  detail: idx === 0 ? detailVal : '',
                                                  qty: 1,
                                                  rate: splitAmt.toFixed(2),
                                                  amount: splitAmt.toFixed(2),
                                                  isDelivered: statusVal === 'Delivered' || statusVal === 'Pakku Bill' || statusVal === 'Tally Entry'
                                              }));
                                          } else {
                                              importedItems.push({
                                                  id: Date.now() + i,
                                                  particular: String(particularStr),
                                                  detail: detailVal,
                                                  qty: 1,
                                                  rate: total,
                                                  amount: total.toFixed(2),
                                                  isDelivered: statusVal === 'Delivered' || statusVal === 'Pakku Bill' || statusVal === 'Tally Entry'
                                              });
                                          }
                                      }

                                      const paymentsArr = [];
                                      if (cashRcvd > 0) paymentsArr.push({ id: Date.now() + i + 1, amount: cashRcvd, mode: 'CASH', date: formattedDate, addedAt: new Date().toISOString() });
                                      if (onlineRcvd > 0) paymentsArr.push({ id: Date.now() + i + 2, amount: onlineRcvd, mode: 'GPAY', date: formattedDate, addedAt: new Date().toISOString() });
                                      if (discountRcvd > 0) paymentsArr.push({ id: Date.now() + i + 3, amount: discountRcvd, mode: 'DISCOUNT', date: formattedDate, addedAt: new Date().toISOString() });
                                      
                                      if (paymentsArr.length === 0 && finalAdvance > 0) {
                                          paymentsArr.push({ id: Date.now() + i + 1, amount: finalAdvance, mode: 'CASH', date: formattedDate, addedAt: new Date().toISOString() });
                                      }

                                      const docData = {
                                          estNo: finalEstNo, 
                                          date: formattedDate,
                                          time: new Date().toLocaleTimeString(),
                                          operatorName: operatorVal,
                                          status: statusVal,
                                          customerName: String(custName).toUpperCase(), 
                                          phone: String(ph),
                                          items: importedItems,
                                          totalAmount: total.toFixed(2),
                                          payments: paymentsArr,
                                          advance: finalAdvance.toFixed(2), 
                                          advanceMode: paymentsArr.length > 0 ? paymentsArr[0].mode : 'CASH',
                                          outstanding: finalOutstanding.toFixed(2), 
                                          proofDate: '',
                                          proofDays: '2 Days',
                                          deliveryTime: '5-7 Working Days',
                                          deliveryDate: (statusVal === 'Delivered' || statusVal === 'Pakku Bill' || statusVal === 'Tally Entry') ? formattedDate : '', 
                                          userId: user?.uid || 'unknown',
                                          updatedAt: serverTimestamp()
                                      };

                                      // Check if estimate exists for upsert
                                      const existingEst = history.find(h => h.estNo === finalEstNo);
                                      if (existingEst) {
                                          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estimates', existingEst.id), docData);
                                      } else {
                                          docData.createdAt = serverTimestamp();
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'estimates'), docData);
                                      }
                                      
                                      importedCount++;
                                  }
                                  if (importedCount > 0) importSummary.push(`Estimates (${sheetName}): ${importedCount}`);
                              }

                              // 2. Process Notes
                              else if (lowerSheetName.includes('note')) {
                                  for (let row of data) {
                                      if (!row['Text']) continue;
                                      const t = String(row['Text']);
                                      const createdStr = parseDateTimeISO(row['Created At']) || new Date().toISOString();
                                      const completedStr = parseDateTimeISO(row['Completed At']);
                                      
                                      const exists = sharedNotes.find(n => n.text === t);
                                      if (!exists) {
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shared_notes'), {
                                              text: t,
                                              isImportant: row['Important'] === 'Yes',
                                              isDone: row['Status'] === 'Done',
                                              createdBy: row['Created By'] || 'Admin',
                                              createdAt: createdStr,
                                              completedBy: row['Completed By'] || null,
                                              completedAt: completedStr
                                          });
                                          importedCount++;
                                      }
                                  }
                                  if (importedCount > 0) importSummary.push(`Notes: ${importedCount}`);
                              }

                              // 3. Process Stock
                              else if (lowerSheetName.includes('stock') || lowerSheetName.includes('inventory')) {
                                  for (let row of data) {
                                      if (!row['Kankotri No']) continue;
                                      const kNo = String(row['Kankotri No']);
                                      const stk = Number(row['Stock']) || 0;
                                      const existingStock = kankotriInventory.find(k => k.kankotriNo === kNo);
                                      if (existingStock) {
                                          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kankotri_inventory', existingStock.id), { stock: stk, updatedAt: serverTimestamp() });
                                      } else {
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'kankotri_inventory'), { kankotriNo: kNo, stock: stk, updatedAt: serverTimestamp() });
                                      }
                                      importedCount++;
                                  }
                                  if (importedCount > 0) importSummary.push(`Stock: ${importedCount}`);
                              }

                              // 4. Process Staff Profiles
                              else if (lowerSheetName.includes('staff profile')) {
                                  for (let row of data) {
                                      if (!row['Staff Name']) continue;
                                      const sName = String(row['Staff Name']);
                                      const wage = Number(row['Daily Wage']) || 0;
                                      const existingProfile = staffProfiles.find(p => p.staffName === sName);
                                      if (existingProfile) {
                                          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_profiles', existingProfile.id), { dailyWage: wage, updatedAt: serverTimestamp() });
                                      } else {
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_profiles'), { staffName: sName, dailyWage: wage, userId: user?.uid || 'unknown', createdAt: serverTimestamp() });
                                      }
                                      importedCount++;
                                  }
                                  if (importedCount > 0) importSummary.push(`Staff Profiles: ${importedCount}`);
                              }

                              // 5. Process Attendance
                              else if (lowerSheetName.includes('attendance') || lowerSheetName.includes('hajari')) {
                                  for (let row of data) {
                                      if (!row['Staff Name'] || !row['Date']) continue;
                                      const dt = parseExcelDate(row['Date']);
                                      const sName = String(row['Staff Name']);
                                      const exists = staffAttendance.find(a => a.date === dt && a.staffName === sName && a.status === (row['Status'] || 'PRESENT'));
                                      if (!exists) {
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_attendance'), {
                                              date: dt,
                                              staffName: sName,
                                              status: row['Status'] || 'PRESENT',
                                              inTime: row['In Time'] || '',
                                              outTime: row['Out Time'] || '',
                                              overtime: row['Overtime (Hrs)'] || '',
                                              note: row['Note'] || '',
                                              userId: user?.uid || 'unknown',
                                              createdAt: serverTimestamp()
                                          });
                                          importedCount++;
                                      }
                                  }
                                  if (importedCount > 0) importSummary.push(`Attendance: ${importedCount}`);
                              }

                              // 6. Process Ledger
                              else if (lowerSheetName.includes('ledger') || lowerSheetName.includes('collection')) {
                                  for (let row of data) {
                                      if (!row['Staff Name'] || !row['Date']) continue;
                                      const dt = parseExcelDate(row['Date']);
                                      const sName = String(row['Staff Name']);
                                      const amt = Number(row['Amount']) || 0;
                                      const typeStr = row['Type'] === 'Extra Work/OT' ? 'EXTRA' : 'ADVANCE';
                                      const exists = staffEntries.find(e => e.date === dt && e.staffName === sName && e.amount === amt && e.ledgerType === typeStr);
                                      if (!exists) {
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_ledger'), {
                                              date: dt,
                                              staffName: sName,
                                              ledgerType: typeStr,
                                              amount: amt,
                                              note: row['Note'] || '',
                                              userId: user?.uid || 'unknown',
                                              createdAt: serverTimestamp()
                                          });
                                          importedCount++;
                                      }
                                  }
                                  if (importedCount > 0) importSummary.push(`Ledger: ${importedCount}`);
                              }

                              // 7. Process Tasks
                              else if (lowerSheetName.includes('task')) {
                                  for (let row of data) {
                                      if (!row['Staff Name'] || !row['Task Detail']) continue;
                                      const dt = parseExcelDate(row['Date']);
                                      const sName = String(row['Staff Name']);
                                      const detail = String(row['Task Detail']);
                                      const exists = staffTasks.find(t => t.assignedDate === dt && t.staffName === sName && t.taskDetail === detail);
                                      if (!exists) {
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff_tasks'), {
                                              assignedDate: dt,
                                              staffName: sName,
                                              taskDetail: detail,
                                              status: row['Status'] || 'PENDING',
                                              completionNote: row['Completion Note'] || '',
                                              userId: user?.uid || 'unknown',
                                              createdAt: serverTimestamp()
                                          });
                                          importedCount++;
                                      }
                                  }
                                  if (importedCount > 0) importSummary.push(`Tasks: ${importedCount}`);
                              }

                              // 8. Process Daily Expenses
                              else if (lowerSheetName.includes('expense')) {
                                  for (let row of data) {
                                      if (!row['Date'] || !row['Amount']) continue;
                                      const dt = parseExcelDate(row['Date']);
                                      const cat = row['Category'] || 'અન્ય પરચુરણ (Other)';
                                      const amt = Number(row['Amount']) || 0;
                                      const exists = dailyExpenses.find(e => e.date === dt && e.category === cat && e.amount === amt);
                                      if (!exists) {
                                          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'daily_expenses'), {
                                              date: dt,
                                              category: cat,
                                              description: row['Description'] || '',
                                              amount: amt,
                                              userId: user?.uid || 'unknown',
                                              createdAt: serverTimestamp()
                                          });
                                          importedCount++;
                                      }
                                  }
                                  if (importedCount > 0) importSummary.push(`Expenses: ${importedCount}`);
                              }
                          }
                      } catch (sheetError) {
                          console.error(`Error processing sheet ${sheetName}:`, sheetError);
                          importSummary.push(`❌ ${sheetName} (Failed)`);
                      }
                  }

                  setImporting(false);
                  
                  if (importSummary.length > 0) {
                      setErrorMessage(`સફળતાપૂર્વક રિસ્ટોર (Import) થયું! 🟢\n${importSummary.join(' | ')}`);
                  } else {
                      setErrorMessage("Excel file માં કોઈ નવો ડેટા મળ્યો નથી.");
                  }
                  
              } catch (err) {
                  console.error("Excel Parse Error:", err);
                  setErrorMessage("Excel file વાંચવામાં ભૂલ થઈ. Format તપાસો.");
                  setImporting(false);
              }
          };
          reader.readAsBinaryString(file);

      } catch (err) {
          console.error("Library Load Error:", err);
          setErrorMessage("Excel Library લોડ નથી થઈ. ઈન્ટરનેટ ચેક કરો.");
          setImporting(false);
      }
      
      e.target.value = '';
  };

  const handleCheckDetails = async (itemId, particular, detail) => {
    setLlmLoading(itemId);
    setLlmFeedback(prev => ({ ...prev, [itemId]: 'Analyzing...' }));
    const systemPrompt = `Act as a printing press expert. Review ITEM and DETAILS. Identify missing specs. Provide CONCISE feedback.`;
    try {
        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: `Item: ${particular}\nDetails: ${detail}` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });
        const result = await response.json();
        setLlmFeedback(prev => ({ ...prev, [itemId]: result.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis." }));
    } catch (error) {
        setLlmFeedback(prev => ({ ...prev, [itemId]: "Error." }));
    } finally { setLlmLoading(null); }
  };

  const sendDataToGoogleSheet = async (data) => {
    if (!isSheetConfigured) return;
    setGoogleSheetSending(true);
    try {
        await fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) { console.error(error); } 
    finally { setGoogleSheetSending(false); }
  };

  const adjustKankotriStock = async (jobItems, oldStatus, newStatus, previousJobItems = null) => {
      if (!kankotriInventory || kankotriInventory.length === 0) return;
      
      const findMatchedKankotriId = (item) => {
          if (!item.particular && !item.detail) return null;
          const textToSearch = `${item.particular || ''} ${item.detail || ''}`.toUpperCase();
          const sortedInv = [...kankotriInventory].sort((a,b) => (b.kankotriNo?.length || 0) - (a.kankotriNo?.length || 0));
          
          for (const k of sortedInv) {
              if (!k.kankotriNo) continue;
              const kNo = k.kankotriNo.toUpperCase();
              const escaped = kNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escaped}($|\\s|[^a-zA-Z0-9])`);
              if (regex.test(textToSearch)) return k.id;
          }
          return null;
      };

      const getUsage = (itemsToCalc) => {
          const usage = {};
          (itemsToCalc || []).forEach(item => {
              const kId = findMatchedKankotriId(item);
              if (kId) usage[kId] = (usage[kId] || 0) + (Number(item.qty) || 0);
          });
          return usage;
      };

      const oldItemsToUse = previousJobItems || jobItems; 
      const oldUsage = getUsage(oldItemsToUse);
      const newUsage = getUsage(jobItems);

      const wasCancelled = oldStatus === 'Order Cancel';
      const isCancelled = newStatus === 'Order Cancel';

      const allKIds = new Set([...Object.keys(oldUsage), ...Object.keys(newUsage)]);
      
      for (const kId of allKIds) {
          const oldQ = wasCancelled ? 0 : (oldUsage[kId] || 0);
          const newQ = isCancelled ? 0 : (newUsage[kId] || 0);
          const diff = newQ - oldQ;
          
          if (diff !== 0) {
              try {
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kankotri_inventory', kId), {
                      stock: increment(-diff),
                      updatedAt: serverTimestamp()
                  });
              } catch (e) {
                  console.error(`Failed to adjust stock for ${kId}:`, e);
              }
          }
      }
  };

  const handleSave = async () => {
    if (!user || !customerName.trim() || !estNo.trim()) {
        setErrorMessage("કૃપા કરીને ગ્રાહકનું નામ દાખલ કરો. (Est. No. ઓટોમેટિક છે)");
        return;
    }
    
    if ((status === 'Order Cancel' || status === 'Job Pending') && !cancelReason.trim()) {
        setErrorMessage(`Status '${status}' માટે કારણ (Reason) લખવું જરૂરી છે.`);
        return;
    }

    const pendingAuthority = items.some(i => i.authorityRequired && !i.authorityReceived);
    if (pendingAuthority && ['Delivered', 'Pakku Bill', 'Tally Entry', 'Part Delivery'].includes(status)) {
        setErrorMessage("સ્ટેમ્પ માટે Authority Letter બાકી છે! આ સ્ટેટસ સેવ કરી શકાશે નહીં.");
        return;
    }

    const formattedEstNo = estNo.trim().toUpperCase(); 
    const formattedCustomerName = customerName.toUpperCase(); 
    
    setErrorMessage('');
    setSaving(true);

    let finalPayments = [...payments];
    const pendingAmount = parseFloat(payAmount);
    if (!isNaN(pendingAmount) && pendingAmount > 0) {
         const autoPayment = {
            id: Date.now(),
            amount: pendingAmount,
            mode: payMode,
            date: payDate,
            addedAt: new Date().toISOString()
         };
         finalPayments.push(autoPayment);
         setPayments(finalPayments); 
         setPayAmount(''); 
    }

    const finalTotalAdvance = finalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const finalOutstanding = totalAmount - finalTotalAdvance;

    const dataToSave = {
        estNo: formattedEstNo, date, time, operatorName, status, designerName, 
        printingVendor: status === 'In Printing' ? printingVendor : '',
        customerName: formattedCustomerName, 
        phone, items, 
        totalAmount: totalAmount.toFixed(2),
        payments: finalPayments, 
        advance: finalTotalAdvance.toFixed(2), 
        advanceMode: finalPayments.length > 0 ? finalPayments[finalPayments.length-1].mode : 'CASH', 
        outstanding: finalOutstanding.toFixed(2), 
        proofDate, 
        proofDays, 
        deliveryTime,
        deliveryDate, 
        cancelReason: (status === 'Order Cancel' || status === 'Job Pending') ? cancelReason : '', 
        userId: user.uid,
        updatedAt: serverTimestamp()
    };

    try {
      if (currentDocId) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estimates', currentDocId), dataToSave);
      } else {
          dataToSave.createdAt = serverTimestamp();
          const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'estimates'), dataToSave);
          setCurrentDocId(docRef.id); 
          
          await sendDataToGoogleSheet(dataToSave);
      }
      
      await adjustKankotriStock(items, originalStatus, status, originalItems);
      setOriginalItems(JSON.parse(JSON.stringify(items)));
      setOriginalStatus(status);

      setSaving(false);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage('સેવ કરવામાં નિષ્ફળતા.');
      setSaving(false);
    }
  };

  const handleFinalDelivery = async (row, paymentAction, mode, deliveredBy) => {
      setShowOutstandingPaymentModal(null);
      setSaving(true);
      setErrorMessage('');

      let finalStatus = row.targetStatus || 'Delivered';
      if (paymentAction === 'pakku_bill') finalStatus = 'Pakku Bill';
      if (paymentAction === 'tally_entry') finalStatus = 'Tally Entry';
      if (paymentAction === 'delivered_only' && row.targetStatus !== 'Pakku Bill' && row.targetStatus !== 'Tally Entry') finalStatus = 'Delivered';

      let finalAdvanceAmt = Number(row.advance) || 0;
      let finalOutstandingAmt = Number(row.outstanding) || 0;

      let updateData = {
          status: finalStatus,
          deliveryDate: new Date().toISOString().split('T')[0], 
          deliveryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
          deliveredBy: deliveredBy, 
          updatedAt: serverTimestamp()
      };

      try {
          if ((paymentAction === 'paid' || paymentAction === 'pakku_bill' || paymentAction === 'tally_entry') && Number(row.outstanding) > 0) {
              const outstandingAmount = Number(row.outstanding);
              
              const currentPayments = row.payments ? [...row.payments] : [];
              
              if (currentPayments.length === 0 && Number(row.advance) > 0) {
                  currentPayments.push({ amount: Number(row.advance), mode: row.advanceMode || 'CASH', date: row.date });
              }

              const finalPayment = {
                  id: Date.now(),
                  amount: outstandingAmount,
                  mode: mode || 'CASH', 
                  date: new Date().toISOString().split('T')[0],
                  isFinal: true
              };
              const updatedPayments = [...currentPayments, finalPayment];
              
              const newAdvance = (Number(row.advance) + outstandingAmount).toFixed(2);
              finalAdvanceAmt = Number(newAdvance);
              finalOutstandingAmt = 0;
              
              updateData.payments = updatedPayments;
              updateData.advance = newAdvance;
              updateData.outstanding = '0.00';
              updateData.advanceMode = mode || 'CASH'; 

          }

          await adjustKankotriStock(row.items, row.status, finalStatus);
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estimates', row.id), updateData);
          setSaving(false);

          // --- 📱 SEND AUTOMATIC THANK YOU & PAYMENT REMINDER WHATSAPP MESSAGE ---
          if (row.phone && row.phone.length >= 10) {
              let msg = '';
              const shortOp = row.operatorName ? row.operatorName.replace(/bhai/i, '') : 'Admin';
              
              if (language === 'Gujarati') {
                  if (finalOutstandingAmt > 0) {
                      msg = `*📦 Delivery Done!*\n\nનમસ્તે *${row.customerName}*,\nતમારું કામ (Est: ${row.estNo}) મોકલી આપ્યું છે.\n\n⚠️ *તમારી બાકી રકમ (Outstanding): ₹${finalOutstandingAmt.toFixed(0)}*\nકૃપા કરીને આ રકમ જમા કરાવવા વિનંતી. 🙏\n\n*Thank You for choosing MOHAMMADI PRESS! 🌸*\n\nAapno sahyog ane trust hamesha aavi j rite malto rahe, evi dilthi 💓 aasha. 😊\n\n*— Team MOHAMMADI PRESS, Khambhat : Press : 84605 47625*`;
                  } else {
                      msg = `*📦 Delivery Done!*\n\nThank You for your valuable order. 🙏\n\n*Thank You for choosing MOHAMMADI PRESS! 🌸*\n\nAapno sahyog ane trust hamesha aavi j rite malto rahe, evi dilthi 💓 aasha. 😊\n\n*— Team MOHAMMADI PRESS, Khambhat : Press : 84605 47625*`;
                  }
              } else {
                  if (finalOutstandingAmt > 0) {
                      msg = `*📦 Delivery Done!*\n\nHello *${row.customerName}*,\nYour job (Est: ${row.estNo}) has been delivered.\n\n⚠️ *Pending Amount: ₹${finalOutstandingAmt.toFixed(0)}*\nKindly clear this outstanding amount. 🙏\n\n*Thank You for choosing MOHAMMADI PRESS! 🌸*\n\nAapno sahyog ane trust hamesha aavi j rite malto rahe, evi dilthi 💓 aasha. 😊\n\n*— Team MOHAMMADI PRESS, Khambhat : Press : 84605 47625*`;
                  } else {
                      msg = `*📦 Delivery Done!*\n\nThank You for your valuable order. 🙏\n\n*Thank You for choosing MOHAMMADI PRESS! 🌸*\n\nAapno sahyog ane trust hamesha aavi j rite malto rahe, evi dilthi 💓 aasha. 😊\n\n*— Team MOHAMMADI PRESS, Khambhat : Press : 84605 47625*`;
                  }
              }
              
              const url = `whatsapp://send?phone=91${row.phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
              window.open(url, '_blank'); 
          }

      } catch (err) {
          console.error("Error finalizing delivery:", err);
          setErrorMessage(`Delivery finalization failed for ${row.estNo}.`);
          setSaving(false);
      }
  };

  const handleStatusUpdate = async (row, newStatus) => {
      const pendingAuthority = row.items?.some(i => i.authorityRequired && !i.authorityReceived);
      if (pendingAuthority && ['Delivered', 'Delivered but Not Sure', 'Pakku Bill', 'Tally Entry', 'Part Delivery'].includes(newStatus)) {
          setErrorMessage(`Est: ${row.estNo} માં સ્ટેમ્પ માટે Authority Letter બાકી છે!`);
          return;
      }

      // ALWAYS open modal on delivery to select delivery person
      if (newStatus === 'Delivered' || newStatus === 'Pakku Bill' || newStatus === 'Tally Entry') {
          setShowOutstandingPaymentModal({ ...row, targetStatus: newStatus });
          return;
      }
      
      if (newStatus === 'In Design') {
          setShowDesignModal({
              id: row.id,
              estNo: row.estNo,
              customerName: row.customerName,
              currentDesigner: row.designerName || ''
          });
          return;
      }

      if (newStatus === 'In Printing') {
          setShowPrintingModal({
              id: row.id,
              estNo: row.estNo,
              customerName: row.customerName,
              currentVendor: row.printingVendor || ''
          });
          return;
      }

      if (newStatus === 'Order Cancel' || newStatus === 'Job Pending') {
          setShowStatusReasonModal({
             doc: row,
             status: newStatus
          });
          return;
      }

      const designerUpdate = newStatus !== 'In Design' ? { designerName: '' } : {};
      
      let additionalUpdates = {};
      const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      
      if (newStatus === 'In Printing') {
          additionalUpdates.inPrintingDate = todayDate;
      } else if (newStatus === 'Job Ready' || newStatus === 'Job Collect Remaining') {
          additionalUpdates.jobReadyDate = todayDate;
      } else if (newStatus === 'Delivered but Not Sure') {
          // આ નવા સ્ટેટસ માટે ડિલિવરી તારીખ અને સમય સેવ કરીએ છીએ
          additionalUpdates.deliveryDate = new Date().toISOString().split('T')[0];
          additionalUpdates.deliveryTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      // --- તમારો આપેલો કોડ અહીં ઉમેરેલ છે (એપના માળખા પ્રમાણે) ---
      // મૂળ બાકી રકમ એમને એમ જ રાખીએ છીએ
      let updatedPendingAmount = row.outstanding;

      // જો સ્ટેટસ માત્ર 'Delivered' હોય, તો જ બાકી રકમ 0 કરો
      if (newStatus === "Delivered") {
          updatedPendingAmount = '0.00';
      }
      // જો 'Delivered but Not Sure' હશે, તો if કન્ડિશન રન નહિ થાય અને બાકી રકમ (outstanding) જળવાઈ રહેશે.
      // -----------------------------------------------------------

      const updateData = {
          status: newStatus,
          outstanding: updatedPendingAmount,
          ...designerUpdate,
          ...additionalUpdates,
          updatedAt: serverTimestamp()
      };

      try {
          await adjustKankotriStock(row.items, row.status, newStatus);
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estimates', row.id), updateData);
          console.log("સ્ટેટસ સફળતાપૂર્વક અપડેટ થઈ ગયું છે!"); // From your code
      } catch (err) {
          console.error("સ્ટેટસ અપડેટ કરવામાં ભૂલ:", err); // From your code
          setErrorMessage(`Status update failed for ${row.estNo}.`);
          return;
      }

      if (newStatus === 'Job Ready' || newStatus === 'Job Collect Remaining') {
          if (!row.phone || row.phone.length < 10) {
              setErrorMessage(`Cannot send WhatsApp: Phone number missing or invalid for ${row.customerName}`);
              return;
          }

          const itemSummary = row.items?.map(i => {
              const checkMark = i.isDelivered ? '✅ ' : '▪️ ';
              return `${checkMark}${i.particular} (Qty: ${i.qty})`;
          }).join('\n');
          
          let header = newStatus === 'Job Ready' ? '*🔔 JOB READY - MOHAMMADI PRESS*' : '*🔔 JOB COLLECT REMAINING - MOHAMMADI PRESS*';
          let subHeader = newStatus === 'Job Ready' ? (language === 'Gujarati' ? 'તમારું ઓર્ડર તૈયાર છે! 📄✨' : 'Your order is ready! 📄✨') : (language === 'Gujarati' ? 'તમારું બાકી ઓર્ડર કલેક્ટ કરવા વિનંતી! 📦✨' : 'Your remaining order is ready for collection! 📦✨');

          let msg = `${header}\nEst. No: ${row.estNo}\n\nHello *${(row.customerName || 'Customer').toUpperCase()}*,\n${subHeader}\n\n*📦 ORDER:*\n${itemSummary}\n\n*💵 STATUS:*\n💰 Total: ₹${row.totalAmount}\n💸 Paid: ₹${row.advance} (${row.advanceMode || 'CASH'})\n------------------\n`;
          msg += Number(row.outstanding) > 0 ? `⚠️ *Outstanding Amt.: ₹${Number(row.outstanding).toFixed(2)}*\n` : `✅ *Outstanding Amt.: PAID*\n`;
          msg += `------------------\n📍 Mohammadi Press\n⏰ *Timing: 10:00 AM to 6:00 PM*\n📞 84605 47625`;
          
          const url = `whatsapp://send?phone=91${row.phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank');
      }
  };

  const handleConfirmReason = async (docId, reason, newStatus) => {
      try {
          const docToUpdate = history.find(h => h.id === docId);
          if (docToUpdate) {
              await adjustKankotriStock(docToUpdate.items, docToUpdate.status, newStatus);
          }
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estimates', docId), {
              status: newStatus,
              cancelReason: reason, 
              updatedAt: serverTimestamp()
          });
          setShowStatusReasonModal(null);
      } catch (err) {
          console.error("Error updating status with reason:", err);
          setErrorMessage(`Status update failed for ${docId}.`);
      }
  };

  const handleAssignDesigner = async (docId, designer) => {
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estimates', docId), {
              designerName: designer,
              status: 'In Design', 
              updatedAt: serverTimestamp()
          });
          setShowDesignModal(null);
      } catch (err) {
          console.error("Error assigning designer:", err);
          setErrorMessage(`Designer assignment failed for ${docId}.`);
      }
  };

  const handleAssignPrintingVendor = async (docId, vendor) => {
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estimates', docId), {
              printingVendor: vendor,
              status: 'In Printing', 
              inPrintingDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
              updatedAt: serverTimestamp()
          });
          setShowPrintingModal(null);
      } catch (err) {
          console.error("Error assigning printing vendor:", err);
          setErrorMessage(`Printing vendor assignment failed for ${docId}.`);
      }
  };

  const handleEditEstimate = (e, row) => {
    if (e) e.stopPropagation(); 
    
    setEstNo(row.estNo || (new Date() >= new Date('2026-04-01T00:00:00') ? 'M-000' : 'ES-000')); 
    setDate(row.date || new Date().toISOString().split('T')[0]);
    setTime(row.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setOperatorName(row.operatorName || 'Murtazabhai'); 
    setStatus(row.status || 'Order Placed Successfully'); 
    setDesignerName(row.designerName || ''); 
    setPrintingVendor(row.printingVendor || ''); 
    setCancelReason(row.cancelReason || ''); 
    setCustomerName(row.customerName || '');
    setPhone(row.phone || '');
    setItems(row.items || []);
    
    setOriginalItems(row.items ? JSON.parse(JSON.stringify(row.items)) : []);
    setOriginalStatus(row.status || 'Order Placed Successfully');
    
    setProofDate(row.proofDate || ''); 
    setProofDays(row.proofDays || ''); 
    setDeliveryTime(row.deliveryTime || '');
    setDeliveryDate(row.deliveryDate || ''); 
    
    let loadedPayments = row.payments ? [...row.payments] : [];
    
    if (loadedPayments.length === 0 && Number(row.advance) > 0) {
        loadedPayments.push({
            id: 'initial',
            amount: Number(row.advance),
            mode: row.advanceMode || 'CASH',
            date: row.date
        });
    }
    setPayments(loadedPayments);
    setPayAmount(''); 

    setCurrentDocId(row.id);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrorMessage('');
  };

  const handleCustomerNameChange = (e) => {
      const val = e.target.value;
      setCustomerName(val.toUpperCase()); 
      
      if (val.trim()) {
          const match = history.find(h => 
              h.customerName?.trim().toLowerCase() === val.trim().toLowerCase() && 
              h.phone && h.phone.length >= 10 
          );
          
          if (match) {
              setPhone(match.phone);
          }
      }
  };

  const handlePhoneChange = (e) => {
      const val = e.target.value.replace(/\D/g,'').slice(0,10);
      setPhone(val);

      if (val.length === 10) {
          const match = history.find(h => h.phone === val && h.customerName);
          if (match) {
              if (currentDocId) {
                  // જો પહેલેથી એડિટિંગ મોડ હોય તો ડાયરેક્ટ નામ નાખી દો
                  setCustomerName(match.customerName);
              } else {
                  // નવો ઓર્ડર હોય ત્યારે પોપઅપ બતાવો
                  setShowPhoneMatchModal(match);
              }
          }
      }
  };

  const handleWhatsApp = () => {
    if (!currentDocId) {
        setErrorMessage("વોટ્સએપ કરતા પહેલા 'SAVE' કરવું જરૂરી છે, જેથી સાચો Estimate No. જાય.");
        return;
    }

    if (!phone) {
      setErrorMessage("WhatsApp નંબર દાખલ કરો."); 
      return;
    }
    setErrorMessage('');

    const savedDoc = history.find(h => h.id === currentDocId);
    const finalEstNo = savedDoc ? savedDoc.estNo : estNo; 
    
    let msg = '';
    
    if (language === 'Gujarati') {
        msg = `*MOHAMMADI PRINTING PRESS*\nEstimate No: ${finalEstNo}\n`;
        msg += `📅 Booking Date: ${new Date(date).toLocaleDateString('en-IN')}\n`;
        if (proofDate) msg += `📝 Proof Date: ${new Date(proofDate).toLocaleDateString('en-IN')} (${getDayOfWeek(proofDate, language)})\n`;
        if (deliveryDate) msg += `🚚 Printing/Delivery Date: ${new Date(deliveryDate).toLocaleDateString('en-IN')} (${getDayOfWeek(deliveryDate, language)})\n`;
        msg += `Status: ${status}\n\n`; 
        msg += `નમસ્તે *${(customerName || 'Customer').toUpperCase()}*,\nતમારો ઓર્ડર બદલ આભાર.\n\n`;
        items.forEach((item, idx) => {
          const checkMark = item.isDelivered ? '✅ ' : '';
          msg += `${idx + 1}. ${checkMark}*${item.particular}*\n   ${item.qty} x ${item.rate} = ₹${item.amount}\n`;
        });
        msg += `\n*કુલ રકમ: ₹${totalAmount.toFixed(2)}*\n`;
        if (payments.length > 0) {
            msg += `\n*જમા રકમ:*`;
            payments.forEach(p => msg += `\n✔️ ₹${p.amount} (${p.mode}) - ${p.date}`);
            msg += `\nકુલ જમા: ₹${totalAdvance.toFixed(2)}\n`;
        } else {
            msg += `જમા: ₹0\n`;
        }
        msg += `*બાકી રકમ: ₹${outstanding.toFixed(2)}*\n`;
        msg += `\nઆભાર!\n⚠️ નોંધ: પ્રિન્ટિંગ/ડિલિવરીમાં 1-2 દિવસનો ફેરફાર થઈ શકે છે.\n\n📍 Mohammadi Press\n⏰ *Timing: 10:00 AM to 6:00 PM*\n📞 84605 47625`;
    } else {
        msg = `*MOHAMMADI PRINTING PRESS*\nEstimate No: ${finalEstNo}\n`;
        msg += `📅 Booking Date: ${new Date(date).toLocaleDateString('en-IN')}\n`;
        if (proofDate) msg += `📝 Proof Date: ${new Date(proofDate).toLocaleDateString('en-IN')} (${getDayOfWeek(proofDate, language)})\n`;
        if (deliveryDate) msg += `🚚 Printing/Delivery Date: ${new Date(deliveryDate).toLocaleDateString('en-IN')} (${getDayOfWeek(deliveryDate, language)})\n`;
        msg += `Status: ${status}\n\n`; 
        msg += `Dear *${(customerName || 'Customer').toUpperCase()}*,\nThank you for your order.\n\n`;
        items.forEach((item, idx) => {
          const checkMark = item.isDelivered ? '✅ ' : '';
          msg += `${idx + 1}. ${checkMark}*${item.particular}*\n   ${item.qty} x ${item.rate} = ₹${item.amount}\n`;
        });
        msg += `\n*Total: ₹${totalAmount.toFixed(2)}*\n`;
        if (payments.length > 0) {
            msg += `\n*Payments Received:*`;
            payments.forEach(p => msg += `\n✔️ ₹${p.amount} (${p.mode}) - ${p.date}`);
            msg += `\nTotal Paid: ₹${totalAdvance.toFixed(2)}\n`;
        } else {
            msg += `Paid: ₹0\n`;
        }
        msg += `*Outstanding Amt.: ₹${outstanding.toFixed(2)}*\n`;
        msg += `\nThank you!\n⚠️ Note: Printing/Delivery may vary by 1-2 days.\n\n📍 Mohammadi Press\n⏰ *Timing: 10:00 AM to 6:00 PM*\n📞 84605 47625`;
    }

    const url = `whatsapp://send?phone=91${phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handlePaymentReminder = (row) => {
      if (!row.phone || row.phone.length < 10) {
          alert("ફોન નંબર નથી!");
          return;
      }
      
      const outstanding = Number(row.outstanding).toFixed(2);
      let msg = '';

      if (language === 'Gujarati') {
          msg = `*🔔 Payment Reminder - Mohammadi Press*\n\nનમસ્તે *${row.customerName}*,\n\nતમારા ઓર્ડર (Est. ${row.estNo}) ની બાકી રકમ *₹${outstanding}* જમા કરાવવા વિનંતી.\n\nઆભાર!\n\n📍 Mohammadi Press\n⏰ *Timing: 10:00 AM to 6:00 PM*\n📞 84605 47625`;
      } else {
          msg = `*🔔 Payment Reminder - Mohammadi Press*\n\nHello *${row.customerName}*,\n\nKindly pay the pending amount of *₹${outstanding}* for your order (Est. ${row.estNo}).\n\nThank you!\n\n📍 Mohammadi Press\n⏰ *Timing: 10:00 AM to 6:00 PM*\n📞 84605 47625`;
      }

      const url = `whatsapp://send?phone=91${row.phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
  };

  const handleViewEstimate = (row) => {
      setViewModalData(row);
  };

  // --- PERFORMANCE OPTIMIZATION: Memoized Lists for Speed ---
  const deliveredJobsContent = useMemo(() => {
      if (filteredDeliveredJobs.length === 0) {
          return <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400 italic">કોઈ ડિલિવર થયેલ જોબ્સ મળ્યા નથી.</td></tr>;
      }
      return (
          <>
              {filteredDeliveredJobs.slice(0, deliveredLimit).map((row) => (
                  <tr 
                      key={row.id} 
                      onClick={() => handleViewEstimate(row)}
                      className={`cursor-pointer transition-colors ${row.status === 'Order Cancel' ? 'bg-rose-50/50 hover:bg-rose-100' : row.status === 'Pakku Bill' ? 'bg-blue-50/50 hover:bg-blue-100' : 'hover:bg-emerald-50/60'}`}
                  >
                      <td className="px-2 py-2.5 font-mono font-bold text-[10px] text-slate-500" title={`Last Edit: ${formatLastEditTime(row.updatedAt || row.createdAt)}`}>{row.estNo}</td> 
                      <td className="px-2 py-2.5 text-[10px] whitespace-nowrap" title={`Last Edit: ${formatLastEditTime(row.updatedAt || row.createdAt)}`}>
                          <div className={`font-bold ${row.status === 'Order Cancel' ? 'text-rose-600' : row.status === 'Pakku Bill' ? 'text-blue-700' : row.status === 'Tally Entry' ? 'text-teal-700' : 'text-emerald-700'}`}>
                              {row.status === 'Order Cancel' ? 'CANCELLED' : (row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-')}
                              {row.status === 'Pakku Bill' && <span className="ml-1 bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[8px]">PB</span>}
                              {row.status === 'Tally Entry' && <span className="ml-1 bg-teal-100 text-teal-700 px-1 py-0.5 rounded text-[8px]">TE</span>}
                          </div>
                          <div className="text-slate-400 font-mono mt-0.5 text-[9px]">
                              {row.deliveryTime || '-'}
                              {row.deliveredBy && <span className="text-indigo-500 font-bold ml-1">By: {row.deliveredBy}</span>}
                          </div>
                      </td>
                      <td className="px-2 py-2.5 text-xs font-bold text-slate-700 whitespace-normal break-words min-w-[100px] max-w-[150px] leading-tight" title={row.customerName}>
                          <button onClick={(e) => { e.stopPropagation(); setLedgerCustomer(row.customerName); }} className="text-indigo-700 hover:text-indigo-900 hover:underline text-left inline-flex items-start gap-1" title="ખાતાવહી (Ledger) જુઓ">
                              <BookOpen className="w-3 h-3 mt-0.5 shrink-0 opacity-70"/> <span>{row.customerName}</span>
                          </button>
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold text-[10px] whitespace-nowrap">₹{Number(row.totalAmount).toFixed(0)}</td>
                      <td className="px-2 py-2.5 text-right font-medium text-[10px] text-slate-500 whitespace-nowrap">₹{Number(row.advance).toFixed(0)}</td>
                      <td className="px-2 py-2.5 text-right font-bold text-[10px] whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                              <span className={`${Number(row.outstanding) > 0 ? 'text-rose-600 bg-rose-50 px-1 rounded' : 'text-emerald-600'}`}>
                                  ₹{Number(row.outstanding).toFixed(0)}
                              </span>
                              {Number(row.outstanding) > 0 && (
                                  <button onClick={(e) => { e.stopPropagation(); handlePaymentReminder(row); }} className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 transition-colors shadow-sm" title="Payment Reminder WhatsApp">
                                      <MessageCircle className="w-3 h-3"/>
                                  </button>
                              )}
                          </div>
                      </td>
                      <td className="px-2 py-2.5 text-center flex justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEditEstimate(e, row); }} className="text-cyan-700 bg-cyan-100 hover:bg-cyan-600 hover:text-white transition-colors p-1.5 rounded" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDuplicateEstimate(e, row); }} className="text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-600 hover:text-white transition-colors p-1.5 rounded" title="Duplicate (Repeat Order)"><Copy className="w-3.5 h-3.5" /></button>
                      </td>
                  </tr>
              ))}
              {filteredDeliveredJobs.length > deliveredLimit && (
                  <tr>
                      <td colSpan="7" className="px-2 py-3 text-center border-t border-slate-200">
                          <button onClick={() => setDeliveredLimit(prev => prev + 100)} className="bg-emerald-50 text-emerald-700 font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors text-xs border border-emerald-200 shadow-sm">
                              વધુ જુઓ (Load More)
                          </button>
                      </td>
                  </tr>
              )}
          </>
      );
  }, [filteredDeliveredJobs, deliveredLimit, language]);

  const activeJobsContent = useMemo(() => {
      if (filteredCurrentJobs.length === 0) {
          return <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-400 italic">કોઈ સક્રિય એસ્ટિમેટ મળ્યા નથી.</td></tr>;
      }
      return (
          <>
              {filteredCurrentJobs.slice(0, activeLimit).map((row, index) => {
                  const currentStatus = row.status || 'In Process';
                  const firstParticular = row.items?.[0]?.particular || 'N/A';
                  const designer = row.designerName || ''; 

                  const isStamp = firstParticular.toLowerCase().includes('stamp');
                  const isKankotri = firstParticular.toLowerCase().includes('kankotri');
                  const isChutniItem = isChutni(firstParticular);

                  const showDateHeader = index === 0 || row.date !== filteredCurrentJobs[index - 1].date;

                  let dayTotal = 0;
                  let dayAdvance = 0;
                  let dayOutstanding = 0;
                  let dailyCount = 0;
                  
                  if (showDateHeader) {
                      for (let i = index; i < filteredCurrentJobs.length; i++) {
                          if (filteredCurrentJobs[i].date === row.date) {
                              dayTotal += Number(filteredCurrentJobs[i].totalAmount) || 0;
                              dayAdvance += Number(filteredCurrentJobs[i].advance) || 0;
                              dayOutstanding += Number(filteredCurrentJobs[i].outstanding) || 0;
                              dailyCount++;
                          } else {
                              break;
                          }
                      }
                  }

                  // NEW: Check if processing order is stuck for more than 3 days without update
                  let isStaleOrder = false;
                  const processingStatuses = ['Order Placed Successfully', 'In Design', 'Proof Send WhatsApp', 'Proof Party Lai gaya', 'Proof Ok', 'Rubber Stamp In Typing', 'In Printing', 'In Working', 'Job Pending'];
                  
                  if (processingStatuses.includes(currentStatus)) {
                      let lastTime = 0;
                      if (row.updatedAt && row.updatedAt.seconds) lastTime = row.updatedAt.seconds * 1000;
                      else if (row.createdAt && row.createdAt.seconds) lastTime = row.createdAt.seconds * 1000;
                      else if (row.date) lastTime = new Date(row.date).getTime();
                      
                      if (lastTime > 0) {
                          const diffTime = new Date().getTime() - lastTime;
                          const diffDays = diffTime / (1000 * 3600 * 24);
                          if (diffDays >= 3) {
                              isStaleOrder = true;
                          }
                      }
                  }

                  return (
                  <React.Fragment key={row.id}>
                  {showDateHeader && (
                      <tr className="bg-slate-200/50 sticky top-[34px] z-10">
                          <td colSpan="10" className="px-2 py-1.5 border-y border-slate-300 backdrop-blur-md">
                              <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide flex items-center gap-2">
                                      <Calendar className="w-3 h-3"/> {new Date(row.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                      <span className="ml-1 bg-slate-300 px-1.5 rounded text-[9px] font-normal text-slate-800">{dailyCount}</span>
                                  </span>
                                  <div className="flex gap-3 text-[10px]">
                                      <span className="font-bold text-slate-600">Total: ₹{dayTotal.toFixed(0)}</span>
                                      <span className="font-bold text-emerald-700">JAMA: ₹{dayAdvance.toFixed(0)}</span>
                                      <span className="font-bold text-rose-600">BAKI: ₹{dayOutstanding.toFixed(0)}</span>
                                  </div>
                              </div>
                          </td>
                      </tr>
                  )}
                  <tr 
                      onClick={() => handleViewEstimate(row)}
                      className={`cursor-pointer transition-colors ${isStaleOrder ? 'bg-red-100 hover:bg-red-200 animate-pulse border-y-2 border-red-500' : 'hover:bg-indigo-50/60'}`}
                  >
                      <td className={`px-2 py-2.5 font-mono font-bold text-[10px] ${isStaleOrder ? 'text-red-900' : 'text-indigo-600'}`} title={`Last Edit: ${formatLastEditTime(row.updatedAt || row.createdAt)}`}>
                          {row.estNo}
                          {isStaleOrder && <AlertTriangle className="w-3 h-3 text-red-600 inline-block ml-1 animate-bounce" title="આ ઓર્ડરમાં છેલ્લા 3 દિવસથી કોઈ ફેરફાર/પ્રોસેસ થયો નથી!" />}
                      </td> 
                      <td className={`px-2 py-2.5 text-[10px] whitespace-nowrap ${isStaleOrder ? 'text-red-800 font-bold' : ''}`} title={`Last Edit: ${formatLastEditTime(row.updatedAt || row.createdAt)}`}>{row.date ? new Date(row.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td className={`px-2 py-2.5 text-[10px] font-semibold truncate max-w-[100px] rounded ${isStaleOrder ? 'text-red-900' : isChutniItem ? 'text-pink-900 bg-pink-200 border border-pink-300' : isStamp ? 'text-violet-700 bg-violet-50' : isKankotri ? 'text-amber-700 bg-amber-50' : ''}`} title={firstParticular}>
                          {isChutniItem && <span className="mr-1">🌶️</span>}
                          {isStamp && !isChutniItem && <span className="mr-1">©️</span>}
                          {isKankotri && !isChutniItem && <span className="mr-1">🧧</span>}
                          {firstParticular}
                      </td>
                      <td className="px-2 py-2.5 text-xs font-bold text-slate-700 whitespace-normal break-words min-w-[100px] max-w-[150px] leading-tight" title={row.customerName}>
                          <button onClick={(e) => { e.stopPropagation(); setLedgerCustomer(row.customerName); }} className={`${isStaleOrder ? 'text-red-900 hover:text-red-700' : 'text-indigo-700 hover:text-indigo-900'} hover:underline text-left inline-flex items-start gap-1 w-full`} title="ખાતાવહી (Ledger) જુઓ">
                              <BookOpen className={`w-3 h-3 mt-0.5 shrink-0 opacity-70 ${isStaleOrder ? 'text-red-700' : ''}`}/> <span>{row.customerName}</span>
                          </button>
                      </td>
                      <td className={`px-2 py-2.5 text-right font-bold text-[10px] whitespace-nowrap ${isStaleOrder ? 'text-red-900' : ''}`}>₹{Number(row.totalAmount).toFixed(0)}</td>
                      <td className={`px-2 py-2.5 text-right font-medium text-[10px] whitespace-nowrap ${isStaleOrder ? 'text-red-800' : ''}`}>₹{Number(row.advance).toFixed(0)}</td>
                      <td className={`px-2 py-2.5 text-right font-bold text-[10px] whitespace-nowrap ${isStaleOrder ? 'text-red-900' : Number(row.outstanding) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{Number(row.outstanding).toFixed(0)}</td>
                      <td className="px-2 py-1.5 text-center min-w-[80px]">
                          <div className="flex flex-col items-center">
                              <select value={currentStatus} onChange={(e) => handleStatusUpdate(row, e.target.value)} className={`text-[9px] p-1 rounded font-bold cursor-pointer transition-colors border shadow-sm w-full outline-none ${isStaleOrder ? 'bg-red-50 text-red-900 border-red-500 ring-2 ring-red-500 shadow-md' : currentStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : currentStatus === 'Pakku Bill' ? 'bg-blue-100 text-blue-700 border-blue-300' : currentStatus === 'Tally Entry' ? 'bg-teal-100 text-teal-700 border-teal-300' : currentStatus === 'Job Ready' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : currentStatus === 'Order Cancel' ? 'bg-rose-100 text-rose-700 border-rose-300' : currentStatus === 'Part Delivery' ? 'bg-purple-100 text-purple-700 border-purple-300' : currentStatus === 'Job Pending' ? 'bg-orange-100 text-orange-700 border-orange-300' : currentStatus === 'In Design' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : currentStatus === 'In Printing' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`} onClick={(e) => e.stopPropagation()} >{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
                              {(designer && currentStatus === 'In Design') ? (
                                  <span className="text-[9px] text-indigo-600 font-extrabold mt-0.5 whitespace-nowrap">({designer})</span>
                              ) : (row.printingVendor && currentStatus === 'In Printing') ? (
                                  <div className="flex flex-col items-center leading-tight">
                                      <span className="text-[9px] text-blue-600 font-extrabold mt-0.5 whitespace-nowrap">({row.printingVendor})</span>
                                      {row.inPrintingDate && <span className="text-[8px] text-slate-500 font-medium whitespace-nowrap">{row.inPrintingDate}</span>}
                                  </div>
                              ) : (currentStatus === 'Job Ready' || currentStatus === 'Job Collect Remaining') && row.jobReadyDate ? (
                                  <span className="text-[8px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">{row.jobReadyDate}</span>
                              ) : null}
                          </div>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                          <div className="flex justify-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleEditEstimate(e, row); }} className={`${isStaleOrder ? 'text-red-700 hover:text-red-900 hover:bg-red-50' : 'text-cyan-700 bg-cyan-100 hover:bg-cyan-600 hover:text-white transition-colors'} p-1.5 rounded`} title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDuplicateEstimate(e, row); }} className={`${isStaleOrder ? 'text-red-700 hover:text-red-900 hover:bg-red-50' : 'text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-600 hover:text-white transition-colors'} p-1.5 rounded`} title="Duplicate (Repeat Order)"><Copy className="w-3.5 h-3.5" /></button>
                          </div>
                      </td>
                  </tr>
                  </React.Fragment>
                  )
              })}
              {filteredCurrentJobs.length > activeLimit && (
                  <tr>
                      <td colSpan="10" className="px-4 py-4 text-center border-t border-slate-200">
                          <button onClick={() => setActiveLimit(prev => prev + 100)} className="bg-indigo-100 text-indigo-800 font-bold px-6 py-2 rounded-lg hover:bg-indigo-200 transition-colors shadow-sm">
                              વધુ જુઓ (Load More)
                          </button>
                      </td>
                  </tr>
              )}
          </>
      );
  }, [filteredCurrentJobs, activeLimit, language, statuses, handleEditEstimate, handleDuplicateEstimate, handleStatusUpdate, handleViewEstimate]);
  // --------------------------------------------------------

  const handlePrintMain = () => {
      if (!currentDocId) {
          setErrorMessage("પ્રિન્ટ કાઢવા માટે પહેલા 'SAVE' કરવું જરૂરી છે, જેથી સાચો Estimate No. પ્રિન્ટમાં આવે.");
          return;
      }
      
      setErrorMessage('');
      console.log("Print button clicked"); 
      window.print();
      setShowPrintTip(true);
      setTimeout(() => setShowPrintTip(false), 5000);
  };

  const handlePrintTallyBill = (job) => {
      if (!job) return;
      
      const totalQty = (job.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      const totalAmount = Number(job.totalAmount) || 0;
      const amountInWords = convertNumberToWords(totalAmount);

      let rowsHtml = '';
      (job.items || []).forEach((item, index) => {
          rowsHtml += `
          <tr>
              <td class="text-center valign-top">${index + 1}</td>
              <td class="valign-top">
                  <strong>${item.particular}</strong><br>
                  <span style="font-style: italic; font-size: 11px;">${item.detail || ''}</span>
              </td>
              <td class="text-right valign-top font-bold">${item.qty} Nos.</td>
              <td class="text-right valign-top">${Number(item.rate).toFixed(2)}</td>
              <td class="text-center valign-top">Nos.</td>
              <td class="text-right valign-top font-bold">${Number(item.amount).toFixed(2)}</td>
          </tr>
          `;
      });

      // Add padding rows to push footer down
      const padCount = Math.max(0, 10 - (job.items ? job.items.length : 0));
      for(let i=0; i<padCount; i++) {
          rowsHtml += `<tr><td style="color:transparent; border-bottom:0; border-top:0;">.</td><td style="border-bottom:0; border-top:0;"></td><td style="border-bottom:0; border-top:0;"></td><td style="border-bottom:0; border-top:0;"></td><td style="border-bottom:0; border-top:0;"></td><td style="border-bottom:0; border-top:0;"></td></tr>`;
      }

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Bill of Supply - ${job.estNo}</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
              @page { size: A4 portrait; margin: 10mm; }
              .bill-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .container { width: 100%; border: 1px solid #000; display: flex; flex-direction: column; }
              .header-row { display: flex; border-bottom: 1px solid #000; min-height: 180px; }
              .col-left { width: 50%; border-right: 1px solid #000; display: flex; flex-direction: column; }
              .company-details { padding: 8px; border-bottom: 1px solid #000; flex-grow: 1; }
              .buyer-details { padding: 8px; flex-grow: 1; }
              .col-right { width: 50%; display: flex; flex-direction: column; }
              .r-row { display: flex; border-bottom: 1px solid #000; min-height: 40px; }
              .r-box { flex: 1; padding: 5px; border-right: 1px solid #000; }
              .r-box:last-child { border-right: none; }
              .r-row-large { flex-grow: 1; padding: 5px; }
              
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 6px; border-bottom: 0; border-top: 0; }
              th { border-bottom: 1px solid #000; border-top: 1px solid #000; text-align: center; font-weight:normal; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .valign-top { vertical-align: top; }
              .font-bold { font-weight: bold; }
              
              .total-row td { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; }
              .words-row { border-bottom: 1px solid #000; padding: 8px; }
              .footer-row { display: flex; min-height: 100px; }
              .sig-box { width: 50%; padding: 8px; border-right: 1px solid #000; position: relative; }
              .sig-box:last-child { border-right: none; text-align: right; }
              .auth-sig { position: absolute; bottom: 8px; right: 8px; }
          </style>
      </head>
      <body>
          <div class="bill-title">BILL OF SUPPLY</div>
          <div class="container">
              <div class="header-row">
                  <div class="col-left">
                      <div class="company-details">
                          <div style="font-size: 16px; font-weight: bold;">MOHAMMADI PRINTING PRESS</div>
                          Nr. Dr. Sakinaben's Dispensary<br>
                          Voharwad, Khambhat-388 620.<br>
                          Dist. Anand. (Gujarat)<br>
                          GSTIN/UIN: 24ANPPJ7938Q1Z0<br>
                          State Name : Gujarat, Code : 24<br>
                          E-Mail : mohammadipress@gmail.com
                      </div>
                      <div class="buyer-details">
                          Buyer (Bill to)<br>
                          <div style="font-size: 14px; font-weight: bold; margin: 5px 0;">${job.customerName}</div>
                          Mo: ${job.phone || ''}<br>
                          State Name : Gujarat, Code : 24
                      </div>
                  </div>
                  <div class="col-right">
                      <div class="r-row">
                          <div class="r-box">Invoice No.<br><strong>${job.estNo}</strong></div>
                          <div class="r-box">Dated<br><strong>${new Date(job.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'2-digit'}).replace(/ /g, '-')}</strong></div>
                      </div>
                      <div class="r-row">
                          <div class="r-box">Delivery Note</div>
                          <div class="r-box">Mode/Terms of Payment<br><strong>${job.payments && job.payments.length > 0 ? job.payments[job.payments.length -1].mode : (job.advanceMode || 'CASH')}</strong></div>
                      </div>
                      <div class="r-row-large">
                          Terms of Delivery
                      </div>
                  </div>
              </div>
              
              <table>
                  <thead>
                      <tr>
                          <th style="width: 5%;">SI<br>No.</th>
                          <th style="width: 45%;">Description of Goods</th>
                          <th style="width: 15%;">Quantity</th>
                          <th style="width: 10%;">Rate</th>
                          <th style="width: 5%;">per</th>
                          <th style="width: 20%;">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${rowsHtml}
                  </tbody>
                  <tr class="total-row">
                      <td colspan="2" class="text-right" style="border-top:1px solid #000;">Total</td>
                      <td class="text-right" style="border-top:1px solid #000;">${totalQty} Nos.</td>
                      <td colspan="2" style="border-top:1px solid #000;"></td>
                      <td class="text-right" style="border-top:1px solid #000;">₹ ${totalAmount.toFixed(2)}</td>
                  </tr>
              </table>
              
              <div class="words-row">
                  <div style="float: right;">E. & O.E</div>
                  Amount Chargeable (in words)<br>
                  <strong>Indian Rupees ${amountInWords} Only</strong>
              </div>
              
              <div class="footer-row">
                  <div class="sig-box">
                      Customer's Seal and Signature
                  </div>
                  <div class="sig-box">
                      <strong>for MOHAMMADI PRINTING PRESS</strong>
                      <div class="auth-sig">Authorised Signatory</div>
                  </div>
              </div>
          </div>
          <script>
              setTimeout(() => window.print(), 500);
          </script>
      </body>
      </html>
      `;

      const win = window.open('', '', 'height=800,width=800');
      win.document.write(html);
      win.document.close();
  };
  
  const handleDownloadAll = async (backupType = "") => {
      try {
          setImporting(true);
          const XlsxPopulate = await loadXlsxPopulate();

          const workbook = await XlsxPopulate.fromBlankAsync();
          const sheet = workbook.sheet(0);
          sheet.name("Register"); 

          const sortedHistory = [...history].sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              if (dateA !== dateB) return dateA - dateB;

              const numA = parseInt(a.estNo.replace(/\D/g, '')) || 0;
              const numB = parseInt(b.estNo.replace(/\D/g, '')) || 0;
              return numA - numB;
          });

          let maxItemsCount = 1;
          sortedHistory.forEach(row => {
              if (row.items && row.items.length > maxItemsCount) {
                  maxItemsCount = row.items.length;
              }
          });

          const headers = ['Es Nos.', 'Date', 'Customer Name', 'MOBILE NUMBER'];
          for(let i=1; i<=maxItemsCount; i++) {
              headers.push(`ITEM ${i} NAME`);
              headers.push(`ITEM ${i} QTY`);
              headers.push(`ITEM ${i} AMT`);
          }
          headers.push('TOTAL AMOUNT', 'CASH RECEIVED', 'ONLINE/BANK RECEIVED', 'DISCOUNT', 'OUTSTANDING', 'STATUS', 'OPERATOR');

          headers.forEach((h, i) => {
              sheet.cell(1, i + 1).value(h).style({ bold: true, fill: "E0E0E0", border: true });
          });

          let currentRow = 2;
          
          let totalAmountSum = 0;
          let totalCashSum = 0;
          let totalOnlineSum = 0;
          let totalDiscountSum = 0; 
          let totalOutstandingSum = 0;

          sortedHistory.forEach((row) => {
              let cashAmt = 0;
              let onlineAmt = 0;
              let discountAmt = 0; 

              if (row.payments && row.payments.length > 0) {
                  row.payments.forEach(p => {
                      if (p.mode === 'CASH') cashAmt += Number(p.amount);
                      else if (p.mode === 'DISCOUNT') discountAmt += Number(p.amount); 
                      else onlineAmt += Number(p.amount);
                  });
              } else if (Number(row.advance) > 0) {
                  if (row.advanceMode === 'CASH') cashAmt = Number(row.advance);
                  else if (row.advanceMode === 'DISCOUNT') discountAmt = Number(row.advance);
                  else onlineAmt = Number(row.advance);
              }
              
              const currentTotal = Number(row.totalAmount);
              const currentOutstanding = Number(row.outstanding);
              
              totalAmountSum += currentTotal;
              totalCashSum += cashAmt;
              totalOnlineSum += onlineAmt;
              totalDiscountSum += discountAmt;
              totalOutstandingSum += currentOutstanding;

              sheet.cell(currentRow, 1).value(row.estNo);
              sheet.cell(currentRow, 2).value(formatDateForExcel(row.date));
              sheet.cell(currentRow, 3).value((row.customerName || '').toUpperCase());
              sheet.cell(currentRow, 4).value(row.phone);
              
              let currentCol = 5;
              for(let i=0; i<maxItemsCount; i++) {
                  if (row.items && row.items[i]) {
                      sheet.cell(currentRow, currentCol++).value(row.items[i].particular || '');
                      sheet.cell(currentRow, currentCol++).value(row.items[i].qty || 1);
                      sheet.cell(currentRow, currentCol++).value(Number(row.items[i].amount) || 0);
                  } else {
                      sheet.cell(currentRow, currentCol++).value('');
                      sheet.cell(currentRow, currentCol++).value('');
                      sheet.cell(currentRow, currentCol++).value('');
                  }
              }

              sheet.cell(currentRow, currentCol++).value(currentTotal);
              sheet.cell(currentRow, currentCol++).value(cashAmt > 0 ? cashAmt : '');
              sheet.cell(currentRow, currentCol++).value(onlineAmt > 0 ? onlineAmt : '');
              sheet.cell(currentRow, currentCol++).value(discountAmt > 0 ? discountAmt : '');
              sheet.cell(currentRow, currentCol++).value(currentOutstanding);
              sheet.cell(currentRow, currentCol++).value(row.status || '');
              sheet.cell(currentRow, currentCol++).value(row.operatorName);

              if (row.status === 'Delivered') {
                  sheet.range(currentRow, 1, currentRow, headers.length).style("fill", "C6EFCE"); 
              } else if (row.status === 'Pakku Bill') {
                  sheet.range(currentRow, 1, currentRow, headers.length).style("fill", "CCE5FF"); 
              } else if (row.status === 'Tally Entry') {
                  sheet.range(currentRow, 1, currentRow, headers.length).style("fill", "B2DFEE"); // Different color for Tally Entry
              }
              
              if (currentOutstanding > 0) {
                  sheet.cell(currentRow, headers.indexOf('OUTSTANDING') + 1).style({ fontColor: "FF0000", bold: true });
              }

              currentRow++;
          });
          
          let totalColStart = headers.indexOf('TOTAL AMOUNT') + 1;
          sheet.cell(currentRow, totalColStart - 1).value("TOTAL").style({ bold: true, horizontalAlignment: "right" });
          sheet.cell(currentRow, totalColStart).value(totalAmountSum).style({ bold: true });
          sheet.cell(currentRow, totalColStart + 1).value(totalCashSum).style({ bold: true });
          sheet.cell(currentRow, totalColStart + 2).value(totalOnlineSum).style({ bold: true });
          sheet.cell(currentRow, totalColStart + 3).value(totalDiscountSum).style({ bold: true });
          sheet.cell(currentRow, totalColStart + 4).value(totalOutstandingSum).style({ bold: true, fontColor: "FF0000" });
          
          sheet.range(currentRow, 1, currentRow, headers.length).style({ border: true, fill: "F2F2F2" });

          sheet.range(1, 1, currentRow - 1, headers.length).autoFilter(); 

          sheet.column(1).width(12);
          sheet.column(2).width(15);
          sheet.column(3).width(35);
          sheet.column(4).width(15);
          
          let colIdx = 5;
          for(let i=0; i<maxItemsCount; i++) {
              sheet.column(colIdx++).width(30);
              sheet.column(colIdx++).width(10);
              sheet.column(colIdx++).width(12);
          }
          sheet.column(colIdx++).width(15); // Total
          sheet.column(colIdx++).width(15); // Cash
          sheet.column(colIdx++).width(20); // Online
          sheet.column(colIdx++).width(12); // Discount
          sheet.column(colIdx++).width(15); // Out
          sheet.column(colIdx++).width(20); // Status
          sheet.column(colIdx++).width(15); // Op

          const blob = await workbook.outputAsync(); 
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          document.body.appendChild(a);
          a.href = url;
          
          // Set filename based on backup type
          if (backupType === "AUTO_BACKUP") {
              a.download = `AutoBackup_MohammadiPress_${new Date().toISOString().split('T')[0]}.xlsx`;
          } else {
              a.download = `Mohammadi_Press_Register_${new Date().toISOString().split('T')[0]}.xlsx`; 
          }
          
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          setImporting(false);

      } catch (err) {
          console.error("Excel Export Error:", err);
          setErrorMessage("Excel export failed. Please try again.");
          setImporting(false);
      }
  };

  const CustomerLedgerModal = ({ customerName, onClose, onEditEstimate }) => {
      const customerJobs = history.filter(h => h.customerName?.trim().toUpperCase() === customerName?.trim().toUpperCase())
          .sort((a, b) => {
              return (b._sortTime || 0) - (a._sortTime || 0); 
          });

      if (customerJobs.length === 0) return null;

      const latestJob = customerJobs[0];
      const phone = latestJob.phone;

      let totalBilled = 0;
      let totalOutstanding = 0;

      customerJobs.forEach(j => {
          totalBilled += Number(j.totalAmount) || 0;
          totalOutstanding += Number(j.outstanding) || 0;
      });
      const totalPaid = totalBilled - totalOutstanding;

      const handleWhatsAppLedger = () => {
           let msg = `*MOHAMMADI PRINTING PRESS*\n*ACCOUNT LEDGER / ખાતાવહી*\n\n`;
           msg += `નમસ્તે *${customerName}*,\nતમારો હિસાબ નીચે મુજબ છે:\n\n`;
           msg += `*કુલ કામ (Total Billed):* ₹${totalBilled.toFixed(2)}\n`;
           msg += `*કુલ જમા (Total Paid):* ₹${totalPaid.toFixed(2)}\n`;
           msg += `------------------------\n`;
           msg += `*કુલ બાકી (Total Pending):* ₹${totalOutstanding.toFixed(2)}\n\n`;
           if (totalOutstanding > 0) {
               msg += `કૃપા કરીને બાકી રકમ જમા કરાવવા વિનંતી.\n\n`;
           }
           msg += `📍 Mohammadi Press\n⏰ *Timing: 10:00 AM to 6:00 PM*\n📞 84605 47625`;
           
           const url = `whatsapp://send?phone=91${phone.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
           window.open(url, '_blank');
      };

      const printLedger = () => {
          const content = document.getElementById('ledger-print-area').innerHTML;
          const win = window.open('', '', 'height=700,width=800');
          win.document.write('<html><head><title>Customer Ledger - ' + customerName + '</title>');
          win.document.write('<style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; } th, td { border: 1px solid #ddd; padding: 6px; text-align: left; } th { background-color: #f2f2f2; } .text-right { text-align: right; } .text-center { text-align: center; } .font-bold { font-weight: bold; } .header-section { margin-bottom: 20px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; } .summary-boxes { display: flex; justify-content: space-between; margin-bottom: 20px; } .summary-box { border: 1px solid #ccc; padding: 10px; width: 30%; text-align: center; border-radius: 5px; background: #f9f9f9; } </style>');
          win.document.write('</head><body>');
          win.document.write(content);
          win.document.write('<script>setTimeout(function(){ window.print(); }, 500);</script>');
          win.document.write('</body></html>');
          win.document.close();
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-indigo-700 text-white rounded-t-xl shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2"><BookOpen className="w-6 h-6"/> ખાતાવહી (Account Ledger)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-indigo-600 rounded-full transition-colors"><X className="w-6 h-6 text-white"/></button>
                </div>
                
                <div className="p-4 border-b bg-indigo-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-extrabold text-indigo-900 uppercase">{customerName}</h2>
                        <p className="text-sm font-bold text-indigo-700 flex items-center gap-1 mt-1">WhatsApp No: {phone || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleWhatsAppLedger} disabled={!phone} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50">
                            <MessageCircle className="w-4 h-4"/> Share on WP
                        </button>
                        <button onClick={printLedger} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
                            <Printer className="w-4 h-4"/> Print
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto bg-slate-100 p-6">
                    <div id="ledger-print-area" className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg min-h-full">
                        <div className="header-section hidden print:block mb-6 text-center border-b-2 border-black pb-4">
                            <h1 className="text-2xl font-bold uppercase m-0">MOHAMMADI PRINTING PRESS</h1>
                            <h2 className="text-xl font-bold mt-2 text-gray-700">Account Ledger / ખાતાવહી</h2>
                            <p className="text-lg font-bold mt-3 border bg-gray-100 py-1 px-4 inline-block uppercase">{customerName}</p>
                            <p className="font-bold text-gray-600">Mo. {phone}</p>
                        </div>

                        <div className="summary-boxes flex justify-between gap-4 mb-6">
                            <div className="summary-box flex-1 border border-indigo-200 bg-indigo-50 p-4 rounded-xl text-center shadow-sm">
                                <p className="text-xs font-bold text-indigo-600 uppercase mb-1">કુલ કામ (Total Billed)</p>
                                <p className="text-2xl font-extrabold text-indigo-900">₹{totalBilled.toFixed(2)}</p>
                            </div>
                            <div className="summary-box flex-1 border border-emerald-200 bg-emerald-50 p-4 rounded-xl text-center shadow-sm">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">કુલ જમા (Total Paid)</p>
                                <p className="text-2xl font-extrabold text-emerald-700">₹{totalPaid.toFixed(2)}</p>
                            </div>
                            <div className="summary-box flex-1 border border-rose-200 bg-rose-50 p-4 rounded-xl text-center shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100 rounded-bl-full -z-10"></div>
                                <p className="text-xs font-bold text-rose-600 uppercase mb-1">કુલ બાકી (Total Pending)</p>
                                <p className="text-2xl font-extrabold text-rose-700">₹{totalOutstanding.toFixed(2)}</p>
                            </div>
                        </div>

                        <h4 className="font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-4 uppercase text-sm">ઓર્ડરની વિગતો (Transaction History)</h4>
                        
                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="border border-slate-300 p-2 text-left w-12 text-center">No.</th>
                                    <th className="border border-slate-300 p-2 text-left w-24">Date</th>
                                    <th className="border border-slate-300 p-2 text-left w-24">Est No.</th>
                                    <th className="border border-slate-300 p-2 text-left">Particulars</th>
                                    <th className="border border-slate-300 p-2 text-right">Total Amt</th>
                                    <th className="border border-slate-300 p-2 text-right">Paid</th>
                                    <th className="border border-slate-300 p-2 text-right">Pending</th>
                                    <th className="border border-slate-300 p-2 text-center">Status</th>
                                    <th className="border border-slate-300 p-2 text-center print:hidden">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerJobs.map((j, i) => (
                                    <tr key={j.id} className="hover:bg-slate-50 border-b border-slate-200">
                                        <td className="border border-slate-300 p-2 text-center text-slate-500">{i+1}</td>
                                        <td className="border border-slate-300 p-2 font-medium">{new Date(j.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'})}</td>
                                        <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-600 text-xs">{j.estNo}</td>
                                        <td className="border border-slate-300 p-2 text-xs">
                                            {j.items?.map((it, idx) => (
                                                <span key={idx} className={isChutni(it.particular) ? 'bg-pink-100 text-pink-800 font-bold px-1 rounded mr-1' : 'mr-1'}>
                                                    {isChutni(it.particular) ? '🌶️ ' : ''}{it.particular}{idx < j.items.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="border border-slate-300 p-2 text-right font-bold">₹{Number(j.totalAmount).toFixed(0)}</td>
                                        <td className="border border-slate-300 p-2 text-right text-emerald-600 font-medium">₹{Number(j.advance).toFixed(0)}</td>
                                        <td className="border border-slate-300 p-2 text-right font-bold text-rose-600">₹{Number(j.outstanding).toFixed(0)}</td>
                                        <td className="border border-slate-300 p-2 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${j.status === 'Delivered' || j.status === 'Pakku Bill' || j.status === 'Tally Entry' ? 'bg-emerald-100 text-emerald-700' : j.status === 'Order Cancel' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {j.status === 'Order Cancel' ? 'CANCELLED' : (j.status === 'Delivered' || j.status === 'Pakku Bill' || j.status === 'Tally Entry' ? 'DELIVERED' : 'PENDING')}
                                            </span>
                                        </td>
                                        <td className="border border-slate-300 p-2 text-center print:hidden">
                                            <button onClick={(e) => onEditEstimate(e, j)} className="p-1.5 bg-sky-50 text-sky-600 rounded hover:bg-sky-100 transition-colors" title="Edit / Load in Main Screen">
                                                <Edit className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-100 font-bold text-slate-800">
                                    <td colSpan="4" className="border border-slate-300 p-2 text-right uppercase">Total:</td>
                                    <td className="border border-slate-300 p-2 text-right text-indigo-800">₹{totalBilled.toFixed(0)}</td>
                                    <td className="border border-slate-300 p-2 text-right text-emerald-700">₹{totalPaid.toFixed(0)}</td>
                                    <td className="border border-slate-300 p-2 text-right text-rose-700">₹{totalOutstanding.toFixed(0)}</td>
                                    <td className="border border-slate-300 p-2"></td>
                                    <td className="border border-slate-300 p-2 print:hidden"></td>
                                </tr>
                            </tfoot>
                        </table>
                        <div className="text-[10px] text-gray-400 mt-4 text-center print:block hidden">Generated on {new Date().toLocaleString('en-IN')}</div>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const DailyReportModal = ({ onClose }) => {
      const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
      const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
      
      const periodNewJobs = history.filter(h => h.date >= startDate && h.date <= endDate);
      const periodDeliveredJobs = deliveredJobs.filter(h => h.deliveryDate >= startDate && h.deliveryDate <= endDate)
        .sort((a, b) => {
            return (b._deliverySortTime || 0) - (a._deliverySortTime || 0);
        });
      
      const periodPayments = history.flatMap(h => {
          const jobPayments = (h.payments && h.payments.length > 0) 
              ? h.payments 
              : (Number(h.advance) > 0 ? [{amount: Number(h.advance), mode: h.advanceMode || 'CASH', date: h.date, addedAt: h.createdAt ? new Date(h.createdAt.seconds * 1000).toISOString() : null}] : []);
          
          return jobPayments.map(p => ({
              ...p,
              estNo: h.estNo,
              customerName: h.customerName
          }));
      }).filter(p => p.date >= startDate && p.date <= endDate)
      .sort((a, b) => {
          const dtA = a.addedAt ? new Date(a.addedAt).getTime() : parseDateTime(a.date, '');
          const dtB = b.addedAt ? new Date(b.addedAt).getTime() : parseDateTime(b.date, '');
          return dtB - dtA;
      });

      const periodExpenses = dailyExpenses.filter(e => e.date >= startDate && e.date <= endDate).sort((a,b) => new Date(b.date) - new Date(a.date));
      const totalExpenseAmountRaw = periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalStaffPettyCash = periodExpenses.filter(e => e.category === 'કારીગર ખર્ચ / એડવાન્સ (Staff Petty Cash)').reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenseAmount = totalExpenseAmountRaw - totalStaffPettyCash;

      const cashPayments = periodPayments.filter(p => p.mode === 'CASH');
      const onlinePayments = periodPayments.filter(p => p.mode !== 'CASH' && p.mode !== 'DISCOUNT' && p.mode !== 'TALLY ENTRY');
      const discountPayments = periodPayments.filter(p => p.mode === 'DISCOUNT'); 
      const tallyPayments = periodPayments.filter(p => p.mode === 'TALLY ENTRY'); 

      const totalCash = cashPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalOnline = onlinePayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalDiscount = discountPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalTally = tallyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalCollection = totalCash + totalOnline; 
      
      const netCashBalance = totalCash - totalExpenseAmount;

      const newBusinessTotal = periodNewJobs.reduce((sum, j) => sum + Number(j.totalAmount), 0);
      const deliveredTotal = periodDeliveredJobs.reduce((sum, j) => sum + Number(j.totalAmount), 0);

      const deliveredFullyPaid = periodDeliveredJobs.filter(j => Number(j.outstanding) <= 0);
      const deliveredWithOutstanding = periodDeliveredJobs.filter(j => Number(j.outstanding) > 0);
      const deliveredOutstandingTotal = deliveredWithOutstanding.reduce((sum, j) => sum + Number(j.outstanding), 0);

      const printReport = () => {
          const content = document.getElementById('daily-report-print-area').innerHTML;
          const win = window.open('', '', 'height=700,width=800');
          win.document.write('<html><head><title>Period Report</title>');
          win.document.write('<style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; } th, td { border: 1px solid #ddd; padding: 5px; text-align: left; } th { background-color: #f2f2f2; } .header { text-align: center; margin-bottom: 20px; } .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; } .summary-box { border: 1px solid #000; padding: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; font-weight: bold; } .amount-cell { text-align: right; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print\\:hidden { display: none !important; } .print\\:block { display: block !important; } } </style>');
          win.document.write('<script src="https://cdn.tailwindcss.com"></script>');
          win.document.write('</head><body>');
          win.document.write('<div id="print-content" style="visibility: hidden;">' + content + '</div>');
          win.document.write('<script>setTimeout(function(){ document.getElementById("print-content").style.visibility="visible"; window.print(); }, 1000);</script>');
          win.document.write('</body></html>');
          win.document.close();
      };

      const dateDisplay = startDate === endDate 
          ? new Date(startDate).toLocaleDateString('en-IN') 
          : `${new Date(startDate).toLocaleDateString('en-IN')} TO ${new Date(endDate).toLocaleDateString('en-IN')}`;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-indigo-50 rounded-t-xl shrink-0">
                    <h3 className="font-bold text-xl flex items-center gap-2 text-indigo-800"><FileBarChart className="w-6 h-6"/> ROJMEL / PERIOD REPORT</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                
                <div className="p-4 border-b bg-gray-50 flex flex-wrap justify-between items-center gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="font-bold text-gray-700 text-sm">From:</label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                className="border border-gray-300 rounded-lg px-3 py-1.5 font-bold text-indigo-700 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="font-bold text-gray-700 text-sm">To:</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                min={startDate}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 font-bold text-indigo-700 text-sm"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={printReport} className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-md">
                            <Printer className="w-4 h-4"/> Print Report
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-slate-100">
                    <div id="daily-report-print-area" className="bg-white p-8 shadow-sm border border-gray-200 min-h-[600px]">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800 uppercase">MOHAMMADI PRINTING PRESS</h1>
                            <p className="text-sm text-gray-500">Period Register Report</p>
                            <p className="text-lg font-bold mt-2 border-b-2 border-indigo-500 inline-block px-4">PERIOD: {dateDisplay}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Total Collection</p>
                                <p className="text-xl font-extrabold text-gray-800">₹{totalCollection.toFixed(0)}</p>
                            </div>
                            <div className="text-center lg:border-l border-gray-200">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Cash Received</p>
                                <p className="text-xl font-extrabold text-emerald-600">₹{totalCash.toFixed(0)}</p>
                            </div>
                            <div className="text-center lg:border-l border-gray-200">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Online (GPay)</p>
                                <p className="text-xl font-extrabold text-blue-600">₹{totalOnline.toFixed(0)}</p>
                            </div>
                            <div className="text-center lg:border-l border-gray-200 bg-rose-50 rounded">
                                <p className="text-[10px] text-rose-600 font-bold uppercase">Expenses (ખર્ચ)</p>
                                <p className="text-xl font-extrabold text-rose-700">₹{totalExpenseAmount.toFixed(0)}</p>
                            </div>
                            <div className="text-center lg:border-l border-gray-200 bg-emerald-100 rounded border border-emerald-300 shadow-sm">
                                <p className="text-[10px] text-emerald-800 font-bold uppercase">Net Cash (ગલ્લો)</p>
                                <p className="text-xl font-extrabold text-emerald-900">₹{netCashBalance.toFixed(0)}</p>
                            </div>
                            <div className="text-center lg:border-l border-gray-200">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">New Business</p>
                                <p className="text-xl font-extrabold text-indigo-600">₹{newBusinessTotal.toFixed(0)}</p>
                            </div>
                        </div>

                        <h4 className="font-bold text-gray-700 mb-2 uppercase border-b pb-1">1. Payment Collection (જમા રકમ)</h4>
                        
                        <div className="mb-4" style={{pageBreakInside: 'avoid'}}>
                            <h5 className="font-bold text-emerald-700 text-sm mb-1 bg-emerald-50 p-1 px-2 rounded">1A. રોકડ આવક (Cash Payments)</h5>
                            <table className="w-full text-sm border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-1.5 text-left w-12">No.</th>
                                        <th className="border p-1.5 text-left w-24">Date & Time</th>
                                        <th className="border p-1.5 text-left">Customer</th>
                                        <th className="border p-1.5 text-left">Est No.</th>
                                        <th className="border p-1.5 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashPayments.length === 0 ? <tr><td colSpan="5" className="p-2 text-center text-gray-400 italic">No cash payments.</td></tr> : 
                                    cashPayments.map((p, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="border p-1.5">{i+1}</td>
                                            <td className="border p-1.5 text-xs">
                                                {new Date(p.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'})}
                                                {p.addedAt && <span className="block text-[9px] text-gray-500 mt-0.5">{new Date(p.addedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </td>
                                            <td className="border p-1.5 font-bold text-gray-700">{p.customerName}</td>
                                            <td className="border p-1.5 font-mono text-xs">{p.estNo}</td>
                                            <td className="border p-1.5 text-right font-bold text-emerald-700">₹{p.amount}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-emerald-50/50 font-bold">
                                        <td colSpan="4" className="border p-1.5 text-right text-emerald-800">TOTAL CASH:</td>
                                        <td className="border p-1.5 text-right text-emerald-700">₹{totalCash.toFixed(0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-6" style={{pageBreakInside: 'avoid'}}>
                            <h5 className="font-bold text-blue-700 text-sm mb-1 bg-blue-50 p-1 px-2 rounded">1B. ઓનલાઇન આવક (Online / Bank Payments)</h5>
                            <table className="w-full text-sm border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-1.5 text-left w-12">No.</th>
                                        <th className="border p-1.5 text-left w-24">Date & Time</th>
                                        <th className="border p-1.5 text-left">Customer</th>
                                        <th className="border p-1.5 text-left">Est No.</th>
                                        <th className="border p-1.5 text-center">Mode</th>
                                        <th className="border p-1.5 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {onlinePayments.length === 0 ? <tr><td colSpan="6" className="p-2 text-center text-gray-400 italic">No online payments.</td></tr> : 
                                    onlinePayments.map((p, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="border p-1.5">{i+1}</td>
                                            <td className="border p-1.5 text-xs">
                                                {new Date(p.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'})}
                                                {p.addedAt && <span className="block text-[9px] text-gray-500 mt-0.5">{new Date(p.addedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </td>
                                            <td className="border p-1.5 font-bold text-gray-700">{p.customerName}</td>
                                            <td className="border p-1.5 font-mono text-xs">{p.estNo}</td>
                                            <td className="border p-1.5 text-center text-xs text-gray-600">{p.mode}</td>
                                            <td className="border p-1.5 text-right font-bold text-blue-700">₹{p.amount}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-50/50 font-bold">
                                        <td colSpan="5" className="border p-1.5 text-right text-blue-800">TOTAL ONLINE:</td>
                                        <td className="border p-1.5 text-right text-blue-700">₹{totalOnline.toFixed(0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            {discountPayments.length > 0 && (
                                <div className="mt-4 mb-4" style={{pageBreakInside: 'avoid'}}>
                                    <h5 className="font-bold text-orange-700 text-sm mb-1 bg-orange-50 p-1 px-2 rounded">1C. ડિસ્કાઉન્ટ / માફી (Discount Given)</h5>
                                    <table className="w-full text-sm border-collapse border border-gray-300">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-1.5 text-left w-12">No.</th>
                                                <th className="border p-1.5 text-left w-24">Date & Time</th>
                                                <th className="border p-1.5 text-left">Customer</th>
                                                <th className="border p-1.5 text-left">Est No.</th>
                                                <th className="border p-1.5 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {discountPayments.map((p, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="border p-1.5">{i+1}</td>
                                                    <td className="border p-1.5 text-xs">
                                                        {new Date(p.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'})}
                                                        {p.addedAt && <span className="block text-[9px] text-gray-500 mt-0.5">{new Date(p.addedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                    </td>
                                                    <td className="border p-1.5 font-bold text-gray-700">{p.customerName}</td>
                                                    <td className="border p-1.5 font-mono text-xs">{p.estNo}</td>
                                                    <td className="border p-1.5 text-right font-bold text-orange-700">₹{p.amount}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-orange-50/50 font-bold">
                                                <td colSpan="4" className="border p-1.5 text-right text-orange-800">TOTAL DISCOUNT:</td>
                                                <td className="border p-1.5 text-right text-orange-700">₹{totalDiscount.toFixed(0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {tallyPayments.length > 0 && (
                                <div className="mt-4 mb-4" style={{pageBreakInside: 'avoid'}}>
                                    <h5 className="font-bold text-teal-700 text-sm mb-1 bg-teal-50 p-1 px-2 rounded">1D. ટેલી એન્ટ્રી (Tally Adjustments)</h5>
                                    <table className="w-full text-sm border-collapse border border-gray-300">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-1.5 text-left w-12">No.</th>
                                                <th className="border p-1.5 text-left w-24">Date & Time</th>
                                                <th className="border p-1.5 text-left">Customer</th>
                                                <th className="border p-1.5 text-left">Est No.</th>
                                                <th className="border p-1.5 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tallyPayments.map((p, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="border p-1.5">{i+1}</td>
                                                    <td className="border p-1.5 text-xs">
                                                        {new Date(p.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'})}
                                                        {p.addedAt && <span className="block text-[9px] text-gray-500 mt-0.5">{new Date(p.addedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                    </td>
                                                    <td className="border p-1.5 font-bold text-gray-700">{p.customerName}</td>
                                                    <td className="border p-1.5 font-mono text-xs">{p.estNo}</td>
                                                    <td className="border p-1.5 text-right font-bold text-teal-700">₹{p.amount}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-teal-50/50 font-bold">
                                                <td colSpan="4" className="border p-1.5 text-right text-teal-800">TOTAL TALLY:</td>
                                                <td className="border p-1.5 text-right text-teal-700">₹{totalTally.toFixed(0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="mt-2 text-right bg-slate-100 p-2 border border-slate-300 rounded font-bold text-lg flex justify-end gap-6 items-center">
                                <div>
                                    <span className="text-xs text-gray-500 block uppercase">Total Collection</span>
                                    <span className="text-indigo-700">₹{totalCollection.toFixed(0)}</span>
                                </div>
                                <div className="text-gray-400">|</div>
                                <div>
                                    <span className="text-xs text-gray-500 block uppercase">Cash Collection</span>
                                    <span className="text-emerald-600">₹{totalCash.toFixed(0)}</span>
                                </div>
                                <div className="text-gray-400">-</div>
                                <div>
                                    <span className="text-xs text-gray-500 block uppercase">Total Expense</span>
                                    <span className="text-rose-600">₹{totalExpenseAmount.toFixed(0)}</span>
                                </div>
                                <div className="text-gray-400">=</div>
                                <div className="bg-emerald-100 px-4 py-1 rounded border border-emerald-300">
                                    <span className="text-[10px] text-emerald-800 block uppercase">Net Cash in Hand</span>
                                    <span className="text-2xl text-emerald-900">₹{netCashBalance.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily Expenses Section */}
                        {periodExpenses.length > 0 && (
                            <div className="mb-8" style={{pageBreakInside: 'avoid'}}>
                                <h4 className="font-bold text-rose-800 mb-2 uppercase border-b border-rose-200 pb-1 mt-6 flex items-center gap-2"><ArrowDownRight className="w-4 h-4"/> Daily Expenses (દૈનિક ખર્ચ)</h4>
                                <table className="w-full text-sm border-collapse border border-rose-300">
                                    <thead className="bg-rose-50 text-rose-900">
                                        <tr>
                                            <th className="border border-rose-200 p-1.5 text-left w-12">No.</th>
                                            <th className="border border-rose-200 p-1.5 text-left w-24">Date</th>
                                            <th className="border border-rose-200 p-1.5 text-left w-48">Category</th>
                                            <th className="border border-rose-200 p-1.5 text-left">Description</th>
                                            <th className="border border-rose-200 p-1.5 text-right w-32">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {periodExpenses.map((exp, i) => (
                                            <tr key={exp.id} className="border-b border-rose-100">
                                                <td className="border border-rose-200 p-1.5">{i+1}</td>
                                                <td className="border border-rose-200 p-1.5 text-xs">{new Date(exp.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'})}</td>
                                                <td className="border border-rose-200 p-1.5 font-bold text-gray-700 text-xs">{exp.category}</td>
                                                <td className="border border-rose-200 p-1.5 text-xs text-gray-600">{exp.description}</td>
                                                <td className="border border-rose-200 p-1.5 text-right font-bold text-rose-700">₹{Number(exp.amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-rose-50 font-bold">
                                            <td colSpan="4" className="border border-rose-200 p-1.5 text-right text-rose-700 uppercase">Total Expenses (Raw):</td>
                                            <td className="border border-rose-200 p-1.5 text-right text-rose-700">₹{totalExpenseAmountRaw.toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-rose-50 font-bold">
                                            <td colSpan="4" className="border border-rose-200 p-1.5 text-right text-rose-700 uppercase">- Staff Petty Cash (કારીગર ખર્ચ):</td>
                                            <td className="border border-rose-200 p-1.5 text-right text-rose-700">₹{totalStaffPettyCash.toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-rose-100 font-bold">
                                            <td colSpan="4" className="border border-rose-200 p-1.5 text-right text-rose-900 uppercase">Net Expenses:</td>
                                            <td className="border border-rose-200 p-1.5 text-right text-rose-800 text-base">₹{totalExpenseAmount.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <h4 className="font-bold text-gray-700 mb-2 uppercase border-b pb-1 mt-8">2. Delivered Jobs (આપેલ ઓર્ડર)</h4>
                        
                        <div className="mb-4" style={{pageBreakInside: 'avoid'}}>
                            <h5 className="font-bold text-emerald-700 text-sm mb-1 bg-emerald-50 p-1 px-2 rounded">2A. પૂરા પૈસા આવેલ ડિલિવરી (Fully Paid)</h5>
                            <table className="w-full text-sm border-collapse border border-gray-300">
                                <thead className="bg-emerald-50">
                                    <tr>
                                        <th className="border p-1.5 text-left w-12">No.</th>
                                        <th className="border p-1.5 text-left w-24">Date & Time</th>
                                        <th className="border p-1.5 text-left">Customer</th>
                                        <th className="border p-1.5 text-left">Est No.</th>
                                        <th className="border p-1.5 text-left">Items</th>
                                        <th className="border p-1.5 text-right">Total Amt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveredFullyPaid.length === 0 ? <tr><td colSpan="6" className="p-2 text-center text-gray-400 italic">No fully paid delivered jobs in this period.</td></tr> :
                                    deliveredFullyPaid.map((j, i) => (
                                        <tr key={j.id} className="border-b">
                                            <td className="border p-1.5">{i+1}</td>
                                            <td className="border p-1.5 text-xs">
                                                {j.deliveryDate ? new Date(j.deliveryDate).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'}) : ''}
                                                {j.deliveryTime && <span className="block text-[9px] text-gray-500 mt-0.5">{j.deliveryTime}</span>}
                                            </td>
                                            <td className="border p-1.5 font-medium">{j.customerName}</td>
                                            <td className="border p-1.5 font-mono text-xs">{j.estNo}</td>
                                            <td className="border p-1.5 text-xs truncate max-w-[150px]">
                                                {j.items.map((it, idx) => (
                                                    <span key={idx} className={isChutni(it.particular) ? 'bg-pink-100 text-pink-800 font-bold px-1 rounded mr-1' : 'mr-1'}>
                                                        {it.particular}{idx < j.items.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                            </td>
                                            <td className="border p-1.5 text-right font-bold text-emerald-800">₹{Number(j.totalAmount).toFixed(0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-6" style={{pageBreakInside: 'avoid'}}>
                            <h5 className="font-bold text-rose-700 text-sm mb-1 bg-rose-50 p-1 px-2 rounded flex justify-between items-center">
                                <span>2B. બાકી પેમેન્ટ વાળી ડિલિવરી (Pending Payment)</span>
                                <span className="bg-rose-200 px-2 rounded text-rose-900">Total Pending: ₹{deliveredOutstandingTotal.toFixed(0)}</span>
                            </h5>
                            <table className="w-full text-sm border-collapse border border-rose-300">
                                <thead className="bg-rose-100">
                                    <tr>
                                        <th className="border border-rose-200 p-1.5 text-left w-12 text-rose-900">No.</th>
                                        <th className="border border-rose-200 p-1.5 text-left w-24 text-rose-900">Date & Time</th>
                                        <th className="border border-rose-200 p-1.5 text-left text-rose-900">Customer</th>
                                        <th className="border border-rose-200 p-1.5 text-left text-rose-900">Est No.</th>
                                        <th className="border border-rose-200 p-1.5 text-left text-rose-900">Items</th>
                                        <th className="border border-rose-200 p-1.5 text-right text-rose-900">Total Amt</th>
                                        <th className="border border-rose-300 p-1.5 text-right text-rose-900 font-extrabold bg-rose-200">Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveredWithOutstanding.length === 0 ? <tr><td colSpan="7" className="p-2 text-center text-gray-400 italic">No pending payments for delivered jobs.</td></tr> :
                                    deliveredWithOutstanding.map((j, i) => (
                                        <tr key={j.id} className="border-b border-rose-100 bg-rose-50/50">
                                            <td className="border border-rose-200 p-1.5">{i+1}</td>
                                            <td className="border border-rose-200 p-1.5 text-xs">
                                                {j.deliveryDate ? new Date(j.deliveryDate).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'}) : ''}
                                                {j.deliveryTime && <span className="block text-[9px] text-gray-500 mt-0.5">{j.deliveryTime}</span>}
                                            </td>
                                            <td className="border border-rose-200 p-1.5 font-medium">{j.customerName}</td>
                                            <td className="border border-rose-200 p-1.5 font-mono text-xs">{j.estNo}</td>
                                            <td className="border border-rose-200 p-1.5 text-xs truncate max-w-[150px]">
                                                {j.items.map((it, idx) => (
                                                    <span key={idx} className={isChutni(it.particular) ? 'bg-pink-100 text-pink-800 font-bold px-1 rounded mr-1' : 'mr-1'}>
                                                        {it.particular}{idx < j.items.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                            </td>
                                            <td className="border border-rose-200 p-1.5 text-right">₹{Number(j.totalAmount).toFixed(0)}</td>
                                            <td className="border border-rose-300 p-1.5 text-right font-extrabold text-rose-700 bg-rose-100/70">₹{Number(j.outstanding).toFixed(0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <h4 className="font-bold text-gray-700 mb-2 uppercase border-b pb-1 mt-6">3. New Estimates (આવેલ નવું કામ)</h4>
                        <table className="w-full text-sm mb-6 border-collapse border border-gray-300" style={{pageBreakInside: 'avoid'}}>
                            <thead className="bg-indigo-50">
                                <tr>
                                    <th className="border p-2 text-left w-12">No.</th>
                                    <th className="border p-2 text-left w-24">Date & Time</th>
                                    <th className="border p-2 text-left">Customer</th>
                                    <th className="border p-2 text-left">Est No.</th>
                                    <th className="border p-2 text-left">Items</th>
                                    <th className="border p-2 text-right">Total Amt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodNewJobs.length === 0 ? <tr><td colSpan="6" className="p-4 text-center text-gray-400 italic">No new jobs in this period.</td></tr> :
                                periodNewJobs.map((j, i) => (
                                    <tr key={j.id} className="border-b">
                                        <td className="border p-2">{i+1}</td>
                                        <td className="border p-2 text-xs">
                                            {j.date ? new Date(j.date).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'2-digit'}) : ''}
                                            {j.time && <span className="block text-[9px] text-gray-500 mt-0.5">{j.time}</span>}
                                        </td>
                                        <td className="border p-2 font-medium">{j.customerName}</td>
                                        <td className="border p-2 font-mono text-xs">{j.estNo}</td>
                                        <td className="border p-2 text-xs truncate max-w-[150px]">
                                            {j.items.map((it, idx) => (
                                                <span key={idx} className={isChutni(it.particular) ? 'bg-pink-100 text-pink-800 font-bold px-1 rounded mr-1' : 'mr-1'}>
                                                    {it.particular}{idx < j.items.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="border p-2 text-right font-bold">₹{Number(j.totalAmount).toFixed(0)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 font-bold text-indigo-900 text-base">
                                    <td colSpan="5" className="border p-2 text-right">TOTAL NEW BUSINESS (નવા કામનું કુલ):</td>
                                    <td className="border p-2 text-right">₹{newBusinessTotal.toFixed(0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const DeliveredRegisterModal = ({ onClose }) => {
      const handlePrintOutstanding = () => {
          const outstandingJobs = deliveredJobs.filter(row => 
              (row.status === 'Delivered' || row.status === 'Pakku Bill' || row.status === 'Tally Entry') && Number(row.outstanding) > 0
          ).sort((a, b) => {
              if (b._deliverySortTime !== a._deliverySortTime) return (b._deliverySortTime || 0) - (a._deliverySortTime || 0);
              return (b._estNoNum || 0) - (a._estNoNum || 0);
          });

          if (outstandingJobs.length === 0) {
              alert("કોઈ બાકી રકમ નથી. (No outstanding payments)");
              return;
          }

          let totalOutstanding = 0;
          let rowsHtml = '';
          outstandingJobs.forEach((job, index) => {
              const outAmt = Number(job.outstanding) || 0;
              totalOutstanding += outAmt;
              const itemsStr = job.items?.map(i => i.particular).join(', ') || '';
              
              rowsHtml += `
                  <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">${job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString('en-IN') : '-'}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; font-size:11px;">${job.estNo}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${job.customerName}<br><span style="font-weight:normal; font-size:10px; color:#555;">${job.phone || ''}</span></td>
                      <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${itemsStr}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #b91c1c; font-weight:bold;">₹${outAmt.toFixed(2)}</td>
                  </tr>
              `;
          });

          const fullHtml = `
              <html>
              <head>
                  <title>Outstanding Report (બાકી લિસ્ટ)</title>
                  <style>
                      body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
                      h2 { text-align: center; color: #991b1b; margin-bottom: 5px; text-transform: uppercase; }
                      .subtitle { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px; background: #fee2e2; padding: 5px; border: 1px solid #fca5a5; display: inline-block; }
                      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                      th { background-color: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; padding: 10px; text-align: left; }
                      td { padding: 8px; border: 1px solid #ddd; }
                      .total-row { font-weight: bold; background-color: #fee2e2; color: #991b1b; font-size: 16px; }
                      @media print {
                          @page { size: A4; margin: 10mm; }
                          body { padding: 0; }
                      }
                  </style>
              </head>
              <body>
                  <div style="text-align: center;">
                      <h2>Mohammadi Printing Press</h2>
                      <div class="subtitle">બાકી લિસ્ટ (Outstanding Report) - Date: ${new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                  <table>
                      <thead>
                          <tr>
                              <th style="width: 5%; text-align: center;">No.</th>
                              <th style="width: 12%;">Del. Date</th>
                              <th style="width: 10%;">Est No.</th>
                              <th style="width: 25%;">Customer Name & Phone</th>
                              <th style="width: 33%;">Items</th>
                              <th style="width: 15%; text-align: right;">બાકી રકમ (Outst.)</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${rowsHtml}
                          <tr class="total-row">
                              <td colspan="5" style="text-align: right; padding: 10px; border: 1px solid #fca5a5;">કુલ બાકી (TOTAL OUTSTANDING):</td>
                              <td style="text-align: right; padding: 10px; border: 1px solid #fca5a5;">₹${totalOutstanding.toFixed(2)}</td>
                          </tr>
                      </tbody>
                  </table>
                  <script>
                      setTimeout(() => window.print(), 500);
                  </script>
              </body>
              </html>
          `;

          const win = window.open('', '', 'height=800,width=1000');
          win.document.write(fullHtml);
          win.document.close();
      };

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl flex flex-col h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b bg-emerald-600 text-white rounded-t-xl">
                    <h3 className="font-bold text-xl flex items-center gap-2"><CheckCircle className="w-6 h-6"/> Delivered / Cancelled Jobs Register (Full View)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-emerald-700 rounded-full transition-colors"><X className="w-6 h-6 text-white"/></button>
                </div>
                
                <div className="p-4 bg-emerald-50 border-b flex flex-wrap gap-4 justify-between items-center">
                     <div className="relative flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Search Customer, Est No, Item, Mobile, Amount..."
                            value={deliveredSearchTerm}
                            onChange={(e) => setDeliveredSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-900 placeholder-emerald-400"
                            autoFocus
                        />
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500"/>
                        {deliveredSearchTerm && <X className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400 cursor-pointer hover:text-emerald-700" onClick={() => setDeliveredSearchTerm('')}/>}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <select 
                            value={deliveredFilterType} 
                            onChange={(e) => setDeliveredFilterType(e.target.value)}
                            className="text-sm font-bold bg-white border border-slate-300 text-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
                        >
                            <option value="ALL">બધા જુઓ (All Records)</option>
                            <option value="OUTSTANDING">બાકી વાળા (Outstanding Only)</option>
                            <option value="CANCELLED">રદ થયેલ (Cancelled Only)</option>
                            <option value="TALLY">ટેલી એન્ટ્રી (Tally Entry)</option>
                        </select>
                        
                        <button onClick={handlePrintOutstanding} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm">
                            <Printer className="w-4 h-4" /> BAAKI PRINT
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-auto bg-slate-100 p-4">
                    <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                            <table className="min-w-full text-sm text-left text-slate-600">
                            <thead className="bg-emerald-100 text-emerald-900 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3">No.</th>
                                    <th className="px-4 py-3">Order Date</th> 
                                    <th className="px-4 py-3">Del. Date</th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Items</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-right">Paid</th>
                                    <th className="px-4 py-3 text-right">Outstanding</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDeliveredJobs.length === 0 ? (
                                    <tr><td colSpan="11" className="px-6 py-12 text-center text-slate-400 italic text-lg">No records found matching your filters.</td></tr>
                                ) : (
                                    <>
                                        {filteredDeliveredJobs.slice(0, deliveredLimit).map((row) => (
                                            <tr 
                                              key={row.id} 
                                              className={`hover:bg-emerald-50/50 transition-colors ${row.status === 'Order Cancel' ? 'bg-rose-50/30' : row.status === 'Pakku Bill' ? 'bg-blue-50/30' : row.status === 'Tally Entry' ? 'bg-teal-50/30' : ''}`}
                                            >
                                            <td className="px-4 py-3 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap font-medium">{row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString('en-IN') : '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-500">{row.deliveryTime || '-'}</td>
                                            <td className="px-4 py-3 font-bold text-slate-700">
                                                <button onClick={(e) => { e.stopPropagation(); setLedgerCustomer(row.customerName); }} className="text-indigo-600 hover:text-indigo-800 hover:underline text-left flex items-start gap-1 w-full" title="ખાતાવહી (Ledger) જુઓ">
                                                    <BookOpen className="w-4 h-4 mt-0.5 shrink-0"/> <span>{row.customerName}</span>
                                                </button>
                                                <span className="text-xs font-normal text-slate-400 block ml-5">{row.phone}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={row.items?.map(i => i.particular).join(', ')}>
                                                {row.items?.map((i, idx) => (
                                                    <span key={idx} className={isChutni(i.particular) ? 'bg-pink-100 text-pink-800 font-bold px-1 rounded border border-pink-200 mr-1' : 'mr-1'}>
                                                        {isChutni(i.particular) ? '🌶️ ' : ''}{i.particular}{idx < row.items.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                                {row.deliveredBy && <div className="text-[10px] font-bold text-indigo-500 mt-1">Delivery Karnara: {row.deliveredBy}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">₹{Number(row.totalAmount).toFixed(0)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-400">₹{Number(row.advance).toFixed(0)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold px-2 py-1 rounded ${Number(row.outstanding) > 0 ? 'bg-rose-100 text-rose-700' : 'text-emerald-600'}`}>
                                                    ₹{Number(row.outstanding).toFixed(0)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${row.status === 'Order Cancel' ? 'bg-rose-100 text-rose-700' : row.status === 'Pakku Bill' ? 'bg-blue-100 text-blue-700' : row.status === 'Tally Entry' ? 'bg-teal-100 text-teal-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center flex justify-center gap-2">
                                                <button onClick={() => { handleViewEstimate(row); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100" title="View"><Eye className="w-4 h-4"/></button>
                                                <button onClick={(e) => { onClose(); handleEditEstimate(e, row); }} className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100" title="Edit"><Edit className="w-4 h-4"/></button>
                                                <button onClick={(e) => { onClose(); handleDuplicateEstimate(e, row); }} className="p-1.5 bg-sky-50 text-sky-600 rounded hover:bg-sky-100" title="Duplicate (Repeat Order)"><Copy className="w-4 h-4"/></button>
                                                {Number(row.outstanding) > 0 && (
                                                    <button onClick={() => handlePaymentReminder(row)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100" title="WhatsApp Reminder"><MessageCircle className="w-4 h-4"/></button>
                                                )}
                                            </td>
                                        </tr>
                                        ))}
                                        {filteredDeliveredJobs.length > deliveredLimit && (
                                            <tr>
                                                <td colSpan="11" className="px-4 py-4 text-center">
                                                    <button onClick={() => setDeliveredLimit(prev => prev + 100)} className="bg-emerald-100 text-emerald-800 font-bold px-6 py-2 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm">
                                                        વધુ જૂના ઓર્ડર જુઓ (Load More)
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const PrintingVendorModal = ({ data, onAssign, onClose }) => {
    const [selectedVendor, setSelectedVendor] = useState(data.currentVendor || printingVendors[0]);
    
    let statusText = '';
    if (data.currentVendor) {
        statusText = `Current Vendor: ${data.currentVendor}`;
    } else {
        statusText = 'No vendor currently assigned.';
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col">
                <div className="flex justify-between items-center p-4 border-b bg-indigo-50 rounded-t-xl">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-800"><Printer className="w-5 h-5"/> Printing Selection</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-700 mb-4">Est. No. <span className="font-bold text-indigo-600">{data.estNo}</span> ({data.customerName}) માટે પ્રિન્ટિંગ વેન્ડર પસંદ કરો</p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-2 text-xs mb-4">
                        {statusText}
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Vendor:</label>
                    <div className="grid grid-cols-2 gap-2">
                        {printingVendors.map(v => (
                            <button 
                                key={v} 
                                onClick={() => setSelectedVendor(v)}
                                className={`p-2 rounded-lg font-bold text-sm transition-colors ${selectedVendor === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-indigo-100'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">રદ કરો</button>
                    <button 
                        onClick={() => onAssign(data.id, selectedVendor)} 
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {selectedVendor} ને સોંપો
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const StatusReasonModal = ({ modalData, onConfirm, onClose }) => {
    const [reason, setReason] = useState(modalData.doc.cancelReason || '');
    const isCancel = modalData.status === 'Order Cancel';
    
    const title = isCancel ? 'ઓર્ડર કેન્સલ કરો' : 'જોબ પેન્ડિંગ (Job Pending)';
    const colorClass = isCancel ? 'red' : 'orange';
    const icon = isCancel ? <AlertTriangle className="w-5 h-5"/> : <Clock className="w-5 h-5"/>;
    const buttonText = isCancel ? 'ઓર્ડર કેન્સલ કરો' : 'પેન્ડિંગ માર્ક કરો';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col">
                <div className={`flex justify-between items-center p-4 border-b bg-${colorClass}-50 rounded-t-xl`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 text-${colorClass}-800`}>{icon} {title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-700 mb-2 font-medium">Est No: <span className="font-bold">{modalData.doc.estNo}</span></p>
                    <p className="text-sm text-gray-700 mb-4 font-medium">Customer: <span className="font-bold">{modalData.doc.customerName}</span></p>

                    <label className="block text-sm font-bold text-gray-700 mb-2">કારણ (Reason):</label>
                    <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={isCancel ? "કારણ લખો... (દા.ત. ભાવ વધારે છે, પાર્ટી ના પાડે છે)" : "કારણ લખો... (દા.ત. ફોન નથી ઉપાડતા, વિગત બાકી છે)"}
                        className={`w-full border rounded-lg p-3 text-sm h-24 focus:ring-${colorClass}-500 focus:border-${colorClass}-500`}
                    />
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">પાછા જાઓ</button>
                    <button 
                        onClick={() => {
                            if (!reason.trim()) {
                                alert("કૃપા કરીને કારણ લખો.");
                                return;
                            }
                            onConfirm(modalData.doc.id, reason, modalData.status);
                        }} 
                        className={`px-4 py-2 bg-${colorClass}-600 text-white font-bold rounded-lg hover:bg-${colorClass}-700 transition-colors`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
  };
  
  const DesignerAssignmentModal = ({ data, onAssign, onClose }) => {
    const [selectedDesigner, setSelectedDesigner] = useState(data.currentDesigner || designers[0]);
    
    let statusText = '';
    if (data.currentDesigner) {
        statusText = `Current Designer: ${data.currentDesigner}`;
    } else {
        statusText = 'No designer currently assigned.';
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col">
                <div className="flex justify-between items-center p-4 border-b bg-indigo-50 rounded-t-xl">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-800"><UserCheck className="w-5 h-5"/> Designer ની નિમણૂક</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-700 mb-4">Est. No. <span className="font-bold text-indigo-600">{data.estNo}</span> ({data.customerName}) માટે ડિઝાઇન વર્ક સોંપો</p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-2 text-xs mb-4">
                        {statusText}
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">ડિઝાઇનર પસંદ કરો:</label>
                    <div className="grid grid-cols-2 gap-2">
                        {designers.map(d => (
                            <button 
                                key={d} 
                                onClick={() => setSelectedDesigner(d)}
                                className={`p-2 rounded-lg font-bold text-sm transition-colors ${selectedDesigner === d ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-indigo-100'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">રદ કરો</button>
                    <button 
                        onClick={() => onAssign(data.id, selectedDesigner)} 
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {selectedDesigner} ને સોંપો
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const OutstandingPaymentModal = ({ data, onFinalize, onClose }) => {
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentAction, setPaymentAction] = useState(data.targetStatus === 'Pakku Bill' ? 'pakku_bill' : data.targetStatus === 'Tally Entry' ? 'tally_entry' : 'paid'); 
    const [deliveredBy, setDeliveredBy] = useState(deliveryPersons[0]);

    const outstandingAmt = Number(data.outstanding).toFixed(2);
    const isZeroOutstanding = Number(data.outstanding) <= 0;

    useEffect(() => {
        if (isZeroOutstanding) {
            setPaymentAction(data.targetStatus === 'Pakku Bill' ? 'pakku_bill' : data.targetStatus === 'Tally Entry' ? 'tally_entry' : 'delivered_only');
        }
    }, [isZeroOutstanding, data.targetStatus]);

    const estNo = data.estNo;
    const customerName = data.customerName;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-4 border-b bg-indigo-50 rounded-t-xl">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-800"><DollarSign className="w-5 h-5"/> Delivery / Payment Details</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className={`${isZeroOutstanding ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-red-100 border-red-500 text-red-800'} border-l-4 p-4 rounded-lg`}>
                        <p className="font-bold">Customer: {customerName}</p>
                        <p className="font-bold">Est. No.: {estNo}</p>
                        <p className="text-2xl font-extrabold mt-2">Baki Rakam (Outstanding): <span className={isZeroOutstanding ? "text-emerald-700" : "text-red-600"}>₹{outstandingAmt}</span></p>
                    </div>

                    {!isZeroOutstanding && (
                        <div className="space-y-3">
                            <label className="block text-base font-bold text-gray-700">Payment Option Nivad (Select Option):</label>
                            
                            <label className="flex items-center space-x-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="delivery-action" 
                                    value="paid" 
                                    checked={paymentAction === 'paid'} 
                                    onChange={() => setPaymentAction('paid')} 
                                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                />
                                <span className="font-semibold text-green-800 flex-grow">Baki payment jama kara (Pay Due)</span>
                            </label>

                            <label className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-300 rounded-lg cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="delivery-action" 
                                    value="pakku_bill" 
                                    checked={paymentAction === 'pakku_bill'} 
                                    onChange={() => setPaymentAction('pakku_bill')} 
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="font-semibold text-blue-800 flex-grow">Pakku Bill mark kara</span>
                            </label>

                            <label className="flex items-center space-x-3 p-3 bg-teal-50 border border-teal-300 rounded-lg cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="delivery-action" 
                                    value="tally_entry" 
                                    checked={paymentAction === 'tally_entry'} 
                                    onChange={() => setPaymentAction('tally_entry')} 
                                    className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                                />
                                <span className="font-semibold text-teal-800 flex-grow">Tally Entry (Outstanding = 0)</span>
                            </label>
                            
                            <label className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="delivery-action" 
                                    value="delivered_only" 
                                    checked={paymentAction === 'delivered_only'} 
                                    onChange={() => setPaymentAction('delivered_only')} 
                                    className="h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                />
                                <span className="font-semibold text-yellow-800 flex-grow">Fakt 'Delivered' mark kara (Baki rakam theva)</span>
                            </label>
                        </div>
                    )}

                    {(paymentAction === 'paid' || paymentAction === 'pakku_bill' || paymentAction === 'tally_entry') && !isZeroOutstanding && (
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode:</label>
                            <select 
                                value={paymentMode} 
                                onChange={(e) => setPaymentMode(e.target.value)} 
                                className="w-full border rounded px-3 py-2 bg-white font-bold text-indigo-700"
                            >
                                {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <label className="block text-sm font-bold text-indigo-800 mb-2">Delivery Karnara Vyakti (Delivered By):</label>
                        <select 
                            value={deliveredBy} 
                            onChange={(e) => setDeliveredBy(e.target.value)} 
                            className="w-full border border-indigo-300 rounded px-3 py-2 bg-white font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            {deliveryPersons.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button 
                        onClick={() => onFinalize(data, paymentAction, (paymentAction === 'paid' || paymentAction === 'pakku_bill' || paymentAction === 'tally_entry') ? paymentMode : null, deliveredBy)} 
                        disabled={saving}
                        className={`px-4 py-2 text-white font-bold rounded-lg transition-colors ${paymentAction === 'paid' ? 'bg-green-600 hover:bg-green-700' : paymentAction === 'pakku_bill' ? 'bg-blue-600 hover:bg-blue-700' : paymentAction === 'tally_entry' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {saving ? 'Saving...' : 'Confirm Delivery'}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const PrintEstimate = ({ data, type }) => {
    const currentMode = payments.length > 0 ? payments[payments.length-1].mode : 'CASH';
    
    let sourceData = data;
    if (!sourceData && currentDocId) {
        sourceData = history.find(h => h.id === currentDocId);
    }

    const d = sourceData || { 
        estNo, 
        date, 
        items, 
        customerName, 
        phone, 
        proofDate, 
        proofDays, 
        deliveryTime, 
        deliveryDate, 
        operatorName, 
        totalAmount, 
        advance: totalAdvance, 
        advanceMode: currentMode, 
        outstanding, 
        status, 
        designerName,
        payments 
    };
    
    const pList = d.payments || (d.advance > 0 ? [{amount: d.advance, mode: d.advanceMode}] : []);
    
    const actualItems = d.items || [];
    const paddingCount = Math.max(0, 5 - actualItems.length);
    const isDense = actualItems.length > 5;
    const cellPad = isDense ? "p-0.5" : "p-1";
    const titleText = isDense ? "text-[11px]" : "text-sm";
    const descText = isDense ? "text-[8px]" : "text-[11px]";
    const valText = isDense ? "text-[9px]" : "text-xs";

    const labels = language === 'Gujarati' ? {
        title: type === 'CUSTOMER' ? 'ગ્રાહક કોપી' : type === 'PRESS' ? 'પ્રેસ કોપી' : 'વ્યૂ કોપી',
        estNo: 'એસ્ટિમેટ નં.',
        date: 'તારીખ',
        status: 'સ્ટેટસ',
        designer: 'ડિઝાઇનર',
        customer: 'ગ્રાહકનું નામ',
        phone: 'વોટ્સએપ નં.',
        no: 'ક્રમ',
        particulars: 'વિગત',
        qty: 'નંગ',
        rate: 'ભાવ',
        amount: 'રકમ',
        details: 'વિગતો:',
        proof: 'પ્રૂફ:',
        time: 'સમય:',
        delDate: 'ડિલિવરી તારીખ:',
        deliveredBy: 'ડિલિવરી આપનાર:',
        entryBy: 'એન્ટ્રી:',
        total: 'કુલ રકમ',
        paid: 'જમા રકમ',
        outstanding: 'બાકી રકમ',
        authSign: 'સહી',
        note: 'નોંધ: પ્રિન્ટિંગ/ડિલિવરીમાં ૧-૨ દિવસનો ફેરફાર થઈ શકે છે.',
        jurisdiction: 'ખંભાત ન્યાયક્ષેત્રને આધીન',
        txns: 'વહેવાર'
    } : {
        title: type + ' COPY',
        estNo: 'Estimate No',
        date: 'Date',
        status: 'Status',
        designer: 'Designer',
        customer: 'Customer Name',
        phone: 'WhatsApp No.',
        no: 'No.',
        particulars: 'Particulars',
        qty: 'Qty',
        rate: 'Rate',
        amount: 'Amount',
        details: 'Details:',
        proof: 'Proof:',
        time: 'Time:',
        delDate: 'Del. Date:',
        deliveredBy: 'Delivered By:',
        entryBy: 'Entry By:',
        total: 'Total',
        paid: 'Advance / Paid',
        outstanding: 'Outstanding Amt.',
        authSign: 'Auth. Signatory',
        note: 'Note: Printing/Delivery may vary by 1-2 days.',
        jurisdiction: 'Subject to Khambhat Jurisdiction',
        txns: 'txns'
    };

    const proofDisplay = d.proofDate 
        ? `${new Date(d.proofDate).toLocaleDateString('en-IN')} (${getDayOfWeek(d.proofDate, language)})` 
        : (d.proofDays || '-');

    return (
      <div className="w-full h-full relative px-4 pt-2 pb-2 font-gujarati bg-white overflow-hidden flex flex-col"> 
        <div className="text-center w-full relative z-30 font-extrabold text-[12px] tracking-widest uppercase pb-0.5 mb-0.5 text-gray-800">ESTIMATE ONLY</div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-20">
           <h1 className="text-6xl font-bold -rotate-45 uppercase text-gray-800">{labels.title}</h1>
        </div>
        <div className="relative z-30 flex justify-between items-start border-b-2 border-black pb-1 mb-1 shrink-0">
          <div className="w-2/3">
            <img src={COMPANY_LOGO_URL} className="h-9 w-auto mb-1 print-logo" onError={(e) => e.target.style.display = 'none'} />
            <p className="text-[11px] font-bold mt-0.5 text-gray-800 leading-tight">Nr. Dr. Sakinaben Dispensary, Vhorwad,</p>
            <p className="text-[11px] font-bold text-gray-800 leading-tight">Khambhat – 388620 (Dist. Anand)</p>
            <p className="text-sm font-bold mt-1">Mo. 98255 47625</p>
          </div>
          <div className="w-1/3 text-right">
             <div className="bg-gray-100 border border-gray-400 p-0.5 inline-block text-left min-w-[120px]">
               <p className="font-bold text-[11px]">{labels.estNo}:</p>
               <p className="text-lg font-mono font-bold text-indigo-800 leading-tight">{d.estNo}</p>
               <p className="text-[10px] border-t border-gray-400 mt-0.5 pt-0.5">{labels.date}: {d.date ? new Date(d.date).toLocaleDateString('en-IN') : ''}</p>
               <p className="text-[10px] border-t border-gray-400 mt-0.5 pt-0.5">{labels.status}: <span className="font-bold text-xs">{d.status || 'N/A'}</span></p> 
               {d.designerName && d.status === 'In Design' && <p className="text-[10px] border-t border-gray-400 mt-0.5 pt-0.5 text-indigo-600">{labels.designer}: <span className="font-bold text-xs">{d.designerName}</span></p>} 
             </div>
          </div>
        </div>
        <div className="relative z-30 mb-2 flex gap-4 shrink-0">
           <div className="flex-1"><p className="text-[10px] text-gray-500 uppercase">{labels.customer}</p><p className="font-bold text-base uppercase border-b border-dotted border-gray-400 leading-snug">{d.customerName}</p></div>
           <div className="w-1/3"><p className="text-[10px] text-gray-500 uppercase">{labels.phone}</p><p className="font-bold text-base border-b border-dotted border-gray-400 leading-snug">{d.phone}</p></div>
        </div>
        <div className="relative z-30 flex-grow flex flex-col">
          <table className="w-full border-collapse border border-black text-xs flex-grow">
            <thead>
              <tr className="bg-gray-200"><th className="border border-black p-1 w-8 text-center">{labels.no}</th><th className="border border-black p-1 text-left">{labels.particulars}</th><th className="border border-black p-1 w-12 text-center">{labels.qty}</th><th className="border border-black p-1 w-16 text-right">{labels.rate}</th><th className="border border-black p-1 w-20 text-right">{labels.amount}</th></tr>
            </thead>
            <tbody>
                {actualItems.map((item, i) => (
                  <tr key={i} className="print-table-row-h">
                    <td className={`border-r border-black ${cellPad} text-center align-top ${valText}`}>{i + 1}</td>
                    <td className={`border-r border-black ${cellPad} align-top`}>
                        <div className={`font-bold leading-snug ${titleText} flex items-start gap-1`}>
                            {item.isDelivered && <span className={`text-green-600 font-extrabold ${isDense ? 'text-[9px]' : 'text-xs'} min-w-[15px]`}>✅</span>}
                            <span className={isChutni(item.particular) ? 'bg-pink-200 text-pink-900 px-1 rounded border border-pink-400' : ''}>{item.particular}</span>
                        </div>
                        <div className={`${descText} text-gray-700 italic leading-snug`}>{item.detail}</div>
                    </td>
                    <td className={`border-r border-black ${cellPad} text-center align-top font-bold ${valText}`}>{item.qty}</td>
                    <td className={`border-r border-black ${cellPad} text-right align-top ${valText}`}>{item.rate}</td>
                    <td className={`border-black ${cellPad} text-right align-top font-bold ${valText}`}>{item.amount}</td>
                  </tr>
                ))}
                {[...Array(paddingCount)].map((_, i) => <tr key={`pad-${i}`} className="print-table-row-h"><td className={`border-r border-black ${cellPad} border-b`}></td><td className={`border-r border-black ${cellPad} border-b`}></td><td className={`border-r border-black ${cellPad} border-b`}></td><td className={`border-r border-black ${cellPad} border-b`}></td><td className={`border-black ${cellPad} border-b`}></td></tr>)}
            </tbody>
            <tfoot className="mt-auto">
              <tr className="border-t border-black" key="t1"><td colSpan="3" rowSpan="3" className="border-r border-black p-1 align-top"><div className="text-[10px] font-bold mb-0.5">{labels.details}</div><div className="flex justify-between text-[10px] mb-0.5"><span>{labels.proof} <span className="font-semibold text-indigo-700">{proofDisplay}</span></span></div><div className="flex justify-between text-[10px] mb-0.5"><span>{labels.time} <span className="font-semibold">{d.deliveryTime}</span></span></div>{d.deliveryDate && (<div className="flex justify-between text-[10px] mt-1 border border-black p-0.5 font-bold bg-yellow-50"><span>{labels.delDate}</span><span className="text-rose-700">{new Date(d.deliveryDate).toLocaleDateString('en-IN')} ({getDayOfWeek(d.deliveryDate, language)})</span></div>)}{d.deliveredBy && (<div className="flex justify-between text-[10px] mt-1 border border-black p-0.5 font-bold bg-indigo-50"><span>{labels.deliveredBy}</span><span className="text-indigo-700">{d.deliveredBy}</span></div>)}{type === 'PRESS' && <div className="text-[9px] text-gray-500 mt-1">{labels.entryBy} {d.operatorName}</div>}</td><td className="border-b border-r border-black p-1 text-right font-bold text-sm">{labels.total}</td><td className="border-b border-black p-1 text-right font-bold text-base">{Number(d.totalAmount).toFixed(2)}</td></tr>
              <tr key="t2"><td className="border-b border-r border-black p-1 text-right text-gray-700 text-sm">{labels.paid} <span className="text-[9px] font-mono block">({pList.length} {labels.txns})</span></td><td className="border-b border-black p-1 text-right text-gray-700 text-sm">{Number(d.advance).toFixed(0)}</td></tr>
              <tr className="bg-yellow-50" key="t3"><td className="border-r border-black p-1 text-right font-extrabold text-sm">{labels.outstanding}</td><td className="border-black p-1 text-right font-extrabold text-lg">{Number(d.outstanding).toFixed(2)}</td></tr>
            </tfoot>
          </table>
        </div>
        <div className="relative z-30 mt-1 flex justify-between items-end pt-1 shrink-0">
          <div className="text-[9px] leading-tight font-gujarati text-gray-800"><p className="font-bold text-blue-900 text-xs">મોહંમદી પ્રિન્ટીંગ પ્રેસ</p><p>ખંભાત-388 620</p>
          <p className="mt-1 font-bold text-[8px] text-gray-500">{labels.note}</p>
          </div>
          <div className="text-center"><p className="text-[9px] text-gray-500 italic mb-1">{labels.jurisdiction}</p><p className="text-sm font-bold border-t border-black px-4 pt-1">{labels.authSign}</p></div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-800 font-bold">Loading...</div>;

  return (
    <div className="min-h-screen text-slate-800 relative font-sans pb-8 bg-[#f8fafc]">

      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx, .xls" 
          className="hidden" 
      />

      {/* MOBILE TOP NAVIGATION */}
      <div className="lg:hidden fixed top-0 left-0 w-full h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-40 shadow-md print:hidden">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-300 p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
                  <Menu className="w-6 h-6" />
              </button>
              <span className="font-extrabold text-white text-lg tracking-wide truncate">Mohammadi Press</span>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-all border border-blue-500">
              {saving ? <RefreshCcw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
              SAVE
          </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm print:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* LEFT SIDEBAR (Drawer on Mobile, Fixed on Desktop) */}
      <div className={`fixed top-0 left-0 h-screen w-64 lg:w-60 bg-slate-900 border-r border-slate-800 shadow-2xl py-6 z-50 print:hidden flex flex-col justify-between overflow-y-auto overflow-x-hidden header-nav transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} style={{ pointerEvents: 'auto' }}>
        <div className="px-4">
            <div className="flex justify-between items-center lg:hidden mb-6 mt-2 border-b border-slate-800 pb-4">
                <span className="text-white font-extrabold text-lg">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="hidden lg:flex justify-center mb-8">
                <div className="font-extrabold text-xl tracking-wider text-white text-center flex items-center gap-3">
                   <span className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-900/20"><Printer className="w-6 h-6"/></span>
                   <div className="flex flex-col text-left leading-none">
                       <span className="tracking-wide">MOHAMMADI</span>
                       <span className="text-[9px] text-slate-400 tracking-[0.25em] mt-1.5 font-semibold">PRINTING PRESS</span>
                   </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full"> 
                 <button onClick={() => { setLanguage(l => l === 'Gujarati' ? 'English' : 'Gujarati'); setIsMobileMenuOpen(false); }} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl font-bold flex items-center justify-start transition-colors shadow-sm" title="Change Language">
                     <Languages className="w-5 h-5 shrink-0 text-slate-400"/> <span className="ml-3 text-sm">{language}</span>
                 </button>
                 <button 
                     onClick={() => { handleNewEstimate(); setIsMobileMenuOpen(false); }} 
                     className="w-full flex items-center justify-start bg-blue-600 hover:bg-blue-500 text-white border-none rounded-xl py-3 px-4 transition-all shadow-lg shadow-blue-900/20 mt-2"
                     title="New Estimate"
                 >
                     <RefreshCw className="w-5 h-5 shrink-0" /><span className="font-bold text-sm tracking-wide ml-3">NEW ESTIMATE</span>
                 </button>
                 <button onClick={() => { handleSave(); setIsMobileMenuOpen(false); }} disabled={saving} className={`w-full hidden lg:flex items-center justify-start text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-xl py-3 px-4 transition-all shadow-lg shadow-emerald-900/20`} title="Save / Update">
                     {saving ? <RefreshCcw className="w-5 h-5 animate-spin shrink-0"/> : <Save className="w-5 h-5 shrink-0" />}
                     <span className="font-bold text-sm tracking-wide ml-3">{saving ? "SAVING..." : (currentDocId ? "UPDATE RECORD" : "SAVE RECORD")}</span>
                 </button>

                 <div className="h-px w-full bg-slate-800 my-3"></div>

                 <button onClick={() => { setShowExpenseModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all group" title="Daily Expenses">
                     <Receipt className="w-5 h-5 shrink-0 text-rose-400 group-hover:scale-110 transition-transform" /><span className="font-medium text-sm ml-3">Expenses</span>
                 </button>
                 
                 <button onClick={() => { setShowNotesModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all relative group" title="Notes & Reminders">
                     <StickyNote className="w-5 h-5 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
                     <span className="font-medium text-sm ml-3">Notes</span>
                     {sharedNotes.filter(n => !n.isDone && n.isImportant).length > 0 && (
                         <span className="absolute top-1/2 -translate-y-1/2 right-3 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-md">
                             {sharedNotes.filter(n => !n.isDone && n.isImportant).length}
                         </span>
                     )}
                 </button>

                 <button onClick={() => { handleImportClick(); setIsMobileMenuOpen(false); }} disabled={importing} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all group" title="Import Excel">
                     {importing ? <RefreshCcw className="w-5 h-5 animate-spin shrink-0 text-slate-400"/> : <Upload className="w-5 h-5 shrink-0 text-slate-400 group-hover:scale-110 transition-transform" />}
                     <span className="font-medium text-sm ml-3">Import Data</span>
                 </button>
                 <button onClick={() => { setShowGlobalSearch(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all group" title="Global Search">
                     <Search className="w-5 h-5 shrink-0 text-sky-400 group-hover:scale-110 transition-transform" /><span className="font-medium text-sm ml-3">Search All</span>
                 </button>
                 <button onClick={() => { setShowInventoryModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all group" title="Stock Inventory">
                     <Package className="w-5 h-5 shrink-0 text-orange-400 group-hover:scale-110 transition-transform" /><span className="font-medium text-sm ml-3">Inventory</span>
                 </button>
                 <button onClick={() => { setShowStaffListModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all group" title="Staff Management">
                     <UserCheck className="w-5 h-5 shrink-0 text-violet-400 group-hover:scale-110 transition-transform" /><span className="font-medium text-sm ml-3">Staff Mgmt</span>
                 </button>
                 <button onClick={() => { handleFullDatabaseBackup(false); setIsMobileMenuOpen(false); }} disabled={importing} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all group" title="Full Database Backup">
                     <HardDrive className="w-5 h-5 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" /><span className="font-medium text-sm ml-3">DB Backup</span>
                 </button>
                 <button onClick={() => { handleWhatsApp(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-start text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl py-3 px-4 transition-all group" title="WhatsApp Share">
                     <MessageCircle className="w-5 h-5 shrink-0 text-green-400 group-hover:scale-110 transition-transform" /><span className="font-medium text-sm ml-3">WhatsApp</span>
                 </button>
                 
                 {/* SECRET BLANK BOX FOR ROJMEL - ONLY FOR ADMIN */}
                 {operatorName === 'Admin' && (
                     <div className="mt-4 w-full flex justify-center px-4">
                         <input 
                             type="password"
                             value={rojmelPassword}
                             onChange={(e) => {
                                 const val = e.target.value;
                                 setRojmelPassword(val);
                                 if (val === '4762') {
                                     setShowDailyReport(true);
                                     setRojmelPassword('');
                                     setIsMobileMenuOpen(false);
                                 }
                             }}
                             className="w-full h-8 bg-slate-800/50 border border-slate-700 rounded-lg outline-none text-center text-slate-400 opacity-30 hover:opacity-100 focus:opacity-100 transition-all focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                             autoComplete="off"
                         />
                     </div>
                 )}
            </div>
        </div>
        <div className="px-4 flex flex-col gap-3 mt-6 text-center">
            <div className="text-[10px] text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 font-medium break-all flex justify-center items-center gap-2 shadow-sm" title={`App ID: ${appId}`}>
                <Database className="w-4 h-4 text-slate-500"/> 
                <span>ID: {appId}</span>
            </div>
            {lastSyncTime && (
                <div className="text-[10px] text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 font-bold shadow-sm flex justify-center items-center gap-2" title={`Last Sync: ${lastSyncTime.toLocaleTimeString('en-IN')}`}>
                    <Clock className="w-4 h-4 text-slate-500"/> 
                    <span>{lastSyncTime.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            )}
        </div>
      </div>
      
      {/* ERROR MESSAGE TOAST */}
      {errorMessage && (
        <div className={`fixed top-20 lg:top-6 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded-2xl shadow-2xl z-[9999] flex items-center gap-3 font-bold animate-bounce-custom w-[90%] max-w-md border-2 ${errorMessage.includes('સફળતાપૂર્વક') ? 'bg-emerald-600 border-emerald-400' : 'bg-rose-600 border-rose-400'}`}>
            {errorMessage.includes('સફળતાપૂર્વક') ? <CheckCircle className="w-6 h-6 shrink-0"/> : <AlertTriangle className="w-6 h-6 shrink-0"/>}
            <span className="flex-grow text-sm leading-tight">{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className={`ml-2 p-1.5 rounded-full transition-colors shrink-0 ${errorMessage.includes('સફળતાપૂર્વક') ? 'hover:bg-emerald-700 bg-emerald-800/50' : 'hover:bg-rose-700 bg-rose-800/50'}`}>
                <X className="w-5 h-5"/>
            </button>
        </div>
      )}

      <div className="relative z-10 print:hidden container mx-auto max-w-full p-3 pt-20 pb-20 lg:p-8 lg:pb-12 lg:pr-8 lg:pl-[17rem]"> 

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            <div className={`space-y-6 ${isRegisterExpanded ? 'hidden xl:hidden' : 'xl:col-span-3'}`}>
                <div className="flex justify-between items-end mb-2">
                     <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">New Estimate</h1>
                     <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full shadow-sm text-xs font-bold border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                             {isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                             <span>{isOnline ? "Online" : "Offline"}</span>
                        </div>
                     </div>
                </div>

                <div className={`bg-white shadow-sm border rounded-2xl p-6 lg:p-8 transition-all ${currentDocId ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200'}`}>
                  {currentDocId && (() => {
                      const cDoc = history.find(h => h.id === currentDocId);
                      const lastEditStr = cDoc ? formatLastEditTime(cDoc.updatedAt || cDoc.createdAt) : '';
                      return (
                          <div className="mb-6 bg-blue-50 text-blue-800 px-4 py-2.5 rounded-xl text-sm font-bold text-center border border-blue-200 flex flex-col md:flex-row justify-center items-center gap-3">
                              <span>📝 Editing Mode: Changes will update <span className="font-mono bg-white px-1.5 py-0.5 rounded text-blue-900 border border-blue-200">{estNo}</span></span>
                              {lastEditStr && (
                                  <span className="text-[11px] bg-white px-2 py-1 rounded text-blue-600 border border-blue-200 shadow-sm">
                                      Last Edit: {lastEditStr}
                                  </span>
                              )}
                          </div>
                      );
                  })()}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Est. No</label>
                        <input 
                            type="text" 
                            value={estNo} 
                            readOnly={true} 
                            className={`w-full border-2 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-600 bg-slate-50 cursor-default border-slate-200 focus:ring-0`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 col-span-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Date</label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 cursor-pointer font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Time</label>
                            <input type="text" value={time} readOnly className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 font-medium"/>
                        </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div className="md:col-span-1">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Operator</label>
                       <select value={operatorName} onChange={handleOperatorChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-white font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer">{operators.map(op => <option key={op} value={op}>{op}</option>)}</select>
                    </div>
                    <div className="md:col-span-1">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                       <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 bg-white font-extrabold text-blue-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer">
                           {statuses.map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}
                       </select>
                    </div>
                    {status === 'In Printing' && (
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Printer className="w-4 h-4"/> Printing Selection</label>
                            <select value={printingVendor} onChange={(e) => setPrintingVendor(e.target.value)} className="w-full border-2 border-blue-200 rounded-xl px-4 py-2.5 bg-blue-50 font-bold text-blue-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer">
                                <option value="" className="text-slate-900">-- Select Printer --</option>
                                {printingVendors.map(v => <option key={v} value={v} className="text-slate-900">{v}</option>)}
                            </select>
                        </div>
                    )}
                    {(status === 'Order Cancel' || status === 'Job Pending') && (
                        <div className={`md:col-span-2 p-4 rounded-xl border-2 mt-2 ${status === 'Order Cancel' ? 'bg-rose-50 border-rose-200' : 'bg-orange-50 border-orange-200'}`}>
                            <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${status === 'Order Cancel' ? 'text-rose-700' : 'text-orange-700'}`}>
                                {status === 'Order Cancel' ? <AlertTriangle className="w-4 h-4"/> : <Clock className="w-4 h-4"/>} 
                                {status === 'Order Cancel' ? 'Cancellation Reason' : 'Pending Reason'}
                            </label>
                            <input 
                                type="text" 
                                value={cancelReason} 
                                onChange={(e) => setCancelReason(e.target.value)} 
                                placeholder={status === 'Order Cancel' ? "e.g., Party denied, Price issue..." : "e.g., Waiting for details..."}
                                className={`w-full border-b-2 bg-transparent px-2 py-1.5 text-sm font-bold focus:outline-none transition-colors ${status === 'Order Cancel' ? 'border-rose-300 text-rose-900 focus:border-rose-600 placeholder-rose-300' : 'border-orange-300 text-orange-900 focus:border-orange-600 placeholder-orange-300'}`}
                            />
                        </div>
                    )}
                    {status === 'In Design' && (
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><UserCheck className="w-4 h-4"/> Assigned Designer</label>
                            <select value={designerName} onChange={(e) => setDesignerName(e.target.value)} className="w-full border-2 border-indigo-200 rounded-xl px-4 py-2.5 bg-indigo-50 font-bold text-indigo-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer">
                                <option value="" className="text-slate-900">-- Select Designer --</option>
                                {designers.map(d => <option key={d} value={d} className="text-slate-900">{d}</option>)}
                            </select>
                        </div>
                    )}
                  </div>
                </div>

                <div className="bg-white shadow-sm rounded-2xl p-6 lg:p-8 border border-slate-200">
                  <h2 className="text-lg font-extrabold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Customer Details</h2>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                        <input 
                            type="text" 
                            list="customerOptions" 
                            value={customerName} 
                            onChange={handleCustomerNameChange} 
                            placeholder="ENTER NAME" 
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold uppercase text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                        <datalist id="customerOptions">
                            {Array.from(new Set(history.map(h => h.customerName).filter(Boolean))).sort().map((name, i) => (
                                <option key={i} value={name} />
                            ))}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp Number</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm font-bold">+91</span>
                            <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="98255XXXXX" className="w-full border-2 border-slate-200 rounded-r-xl px-4 py-2.5 font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"/>
                        </div>
                    </div>
                  </div>

                  {/* NEW FEATURE: CUSTOMER LEDGER & ACTIVE JOBS SUMMARY */}
                  {customerStats && (
                    <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner transition-all duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600"/> ખાતાવહી સારાંશ (Ledger Summary)</h4>
                                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                                    <span className="text-slate-600 font-medium">કુલ કામ: <span className="font-bold text-slate-800">₹{customerStats.totalBilled.toFixed(0)}</span></span>
                                    <span className="text-slate-600 font-medium">કુલ જમા: <span className="font-bold text-emerald-600">₹{customerStats.totalPaid.toFixed(0)}</span></span>
                                    <span className="text-slate-600 font-medium">કુલ બાકી: <span className="font-extrabold text-rose-600">₹{customerStats.totalOutstanding.toFixed(0)}</span></span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setLedgerCustomer(customerName)} 
                                className="shrink-0 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
                            >
                                <List className="w-3.5 h-3.5"/> આખું ખાતાવહી જુઓ (Full Ledger)
                            </button>
                        </div>

                        {customerStats.activeJobs.length > 0 ? (
                            <div>
                                <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-blue-500"/> ચાલુ કામનું સ્ટેટસ (Active Jobs Status):</h5>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {customerStats.activeJobs.map(job => {
                                        const progress = getStatusProgress(job.status);
                                        return (
                                            <div key={job.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group" onClick={() => handleEditEstimate(null, job)} title="Click to Edit this Estimate">
                                                <div className="flex justify-between items-center mb-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{job.estNo}</span>
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]" title={job.items?.[0]?.particular}>{job.items?.[0]?.particular}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">{job.status}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                                                    <div className={`h-full ${progress.color} transition-all duration-1000 ease-out`} style={{ width: `${progress.percent}%` }}></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 text-xs font-bold flex items-center gap-2">
                                <CheckCircle className="w-4 h-4"/> કોઈ ચાલુ કામ નથી. આ ગ્રાહકના બધા ઓર્ડર અપાઈ ગયા છે. (All Delivered)
                            </div>
                        )}
                    </div>
                  )}

                </div>

                <div className="bg-white shadow-sm rounded-2xl p-6 lg:p-8 border border-slate-200">
                   <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                       <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2"><List className="w-5 h-5 text-blue-600"/> Order Items</h2>
                       <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-600/30"><Plus className="w-4 h-4" /> Add Item</button>
                   </div>
                   <datalist id="pressItems">{pressItems.map(item => <option key={item} value={item} />)}</datalist>
                   
                   <div className="space-y-5">
                     {items.map((item, index) => {
                        let suggestions = itemSuggestions[item.particular] || [];
                         if (item.particular && item.particular.toLowerCase().includes('kankotri')) {
                            const kankotriNumbers = kankotriInventory.map(k => k.kankotriNo).filter(Boolean);
                            if (kankotriNumbers.length > 0) {
                                suggestions = [...new Set([...suggestions, ...kankotriNumbers])];
                            }
                        }

                        const currentDetail = item.detail?.toLowerCase() || '';
                        const filteredSuggestions = suggestions.filter(s => s.toLowerCase().includes(currentDetail));
                        
                        const isStampItem = item.particular && item.particular.toLowerCase().includes('stamp');
                        const isAuthPending = item.authorityRequired && !item.authorityReceived;
                        const isAuthCleared = item.authorityRequired && item.authorityReceived;

                        return (
                       <div key={item.id} className={`border-2 rounded-2xl p-5 relative group transition-all duration-200 ${isAuthPending ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400' : isAuthCleared ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'}`}>
                          <button onClick={() => removeItem(item.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                          
                          <div className="flex items-center gap-3 mb-4">
                              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-lg border border-slate-200">Item #{index + 1}</span>
                              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors shadow-sm">
                                  <input 
                                    type="checkbox" 
                                    checked={item.isDelivered || false} 
                                    onChange={(e) => {
                                        if (isAuthPending && e.target.checked) {
                                            alert("Authority Letter બાકી છે! (Authority Required)");
                                            return;
                                        }
                                        handleItemChange(item.id, 'isDelivered', e.target.checked);
                                    }}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded border-gray-300 cursor-pointer"
                                  />
                                  <span className="text-xs font-extrabold text-emerald-700">Delivered</span>
                              </label>
                          </div>

                          <div className="grid grid-cols-12 gap-4">
                              <div className="col-span-12 md:col-span-6">
                                  <input list="pressItems" placeholder="Item Name / વસ્તુનું નામ" value={item.particular} onChange={(e) => handleItemChange(item.id, 'particular', e.target.value)} className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold mb-3 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${isChutni(item.particular) ? 'bg-pink-50 text-pink-900 border-pink-300 focus:border-pink-500' : 'border-slate-200 text-slate-800 focus:border-blue-500'}`}/>
                                  <div className="flex items-center gap-2">
                                      <div className="relative flex-grow">
                                        <input 
                                            type="text"
                                            placeholder="Details (Select or Type)..." 
                                            value={item.detail} 
                                            onChange={(e) => handleItemChange(item.id, 'detail', e.target.value)} 
                                            onFocus={() => setFocusedDetailId(item.id)}
                                            onBlur={() => setTimeout(() => setFocusedDetailId(null), 200)}
                                            className="w-full border-2 border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                                        
                                        {focusedDetailId === item.id && filteredSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto left-0 top-full">
                                                {filteredSuggestions.map(s => {
                                                    const kankotri = kankotriInventory.find(k => k.kankotriNo === s);
                                                    return (
                                                        <div 
                                                            key={s} 
                                                            onClick={(e) => { 
                                                                e.stopPropagation();
                                                                handleItemChange(item.id, 'detail', s); 
                                                                setFocusedDetailId(null); 
                                                            }}
                                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0 transition-colors"
                                                        >
                                                            <span className="font-bold text-slate-700 text-sm">{s}</span>
                                                            {kankotri && (
                                                                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm ${kankotri.stock <= 50 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                                    Stock: {kankotri.stock}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                      </div>
                                      
                                      <button onClick={() => handleCheckDetails(item.id, item.particular, item.detail)} disabled={llmLoading === item.id || !item.particular} className="shrink-0 bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-sm">{llmLoading === item.id ? '...' : '✨ QC'}</button>
                                  </div>
                                  {llmFeedback[item.id] && <div className="mt-3 p-3 text-xs bg-amber-50 text-amber-900 border border-amber-200 rounded-xl font-medium">{llmFeedback[item.id]}</div>}
                              </div>
                              <div className="col-span-4 md:col-span-2">
                                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">Qty</label>
                                  <input type="number" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 text-right outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"/>
                              </div>
                              <div className="col-span-4 md:col-span-2">
                                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">Rate</label>
                                  <input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 text-right outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"/>
                              </div>
                              <div className="col-span-4 md:col-span-2">
                                  <label className="text-[10px] uppercase tracking-wider font-bold text-blue-600 mb-1.5 block">Amount</label>
                                  <input type="number" value={item.amount} onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)} className="w-full bg-blue-50 border-2 border-blue-200 text-blue-900 font-extrabold rounded-xl px-3 py-2.5 text-right outline-none"/>
                              </div>
                          </div>
                          
                          {isStampItem && (
                              <div className={`mt-4 p-3 rounded-xl border-2 flex flex-wrap gap-6 items-center ${isAuthPending ? 'bg-white border-rose-200 shadow-sm' : 'bg-slate-50/50 border-slate-200'}`}>
                                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-rose-700 select-none">
                                      <input 
                                        type="checkbox" 
                                        checked={item.authorityRequired || false} 
                                        onChange={(e) => handleItemChange(item.id, 'authorityRequired', e.target.checked)}
                                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 w-5 h-5 cursor-pointer"
                                      />
                                      Authority Required (ઓથોરિટી લેટર)
                                  </label>
                                  {item.authorityRequired && (
                                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-emerald-700 select-none border-l-2 pl-4 border-slate-200">
                                          <input 
                                            type="checkbox" 
                                            checked={item.authorityReceived || false} 
                                            onChange={(e) => handleItemChange(item.id, 'authorityReceived', e.target.checked)}
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
                                          />
                                          Authority Received (મળી ગયેલ છે)
                                      </label>
                                  )}
                              </div>
                          )}
                       </div>
                     )})}
                   </div>
                </div>

                <div className="bg-white shadow-sm rounded-2xl p-6 lg:p-8 border border-slate-200">
                   <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                      <div className="space-y-5">
                         <h3 className="text-lg font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4">Process Info</h3>
                         
                         <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider font-bold flex justify-between items-center mb-1.5">
                                <span>Proof Date</span>
                                {proofDate && <span className="text-blue-700 font-extrabold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-sm">{getDayOfWeek(proofDate, language)}</span>}
                            </label>
                            <input 
                                type="date" 
                                value={proofDate} 
                                onChange={(e) => setProofDate(e.target.value)} 
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-800 transition-all" 
                            />
                            <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-hide">
                                <button type="button" onClick={() => setProofDate(getFutureDateStr(0))} className="text-xs font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors whitespace-nowrap">Today</button>
                                <button type="button" onClick={() => setProofDate(getFutureDateStr(1))} className="text-xs font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors whitespace-nowrap">Tomorrow</button>
                                <button type="button" onClick={() => setProofDate(getFutureDateStr(2))} className="text-xs font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors whitespace-nowrap">2 Days</button>
                                <button type="button" onClick={() => setProofDate(getFutureDateStr(3))} className="text-xs font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors whitespace-nowrap">3 Days</button>
                            </div>
                         </div>
                         
                         <div>
                             <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5 block">Delivery Time</label>
                             <input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"/>
                         </div>
                         
                         <div className="bg-amber-50/50 p-4 rounded-xl border-2 border-amber-200/60">
                             <label className="text-xs text-amber-800 uppercase tracking-wider font-bold flex justify-between items-center mb-2">
                                 <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Delivery Date</span>
                                 {deliveryDate && <span className="text-rose-700 font-extrabold bg-rose-100 px-2.5 py-0.5 rounded-lg border border-rose-200 shadow-sm">{getDayOfWeek(deliveryDate, language)}</span>}
                             </label>
                             <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full border-2 border-amber-300 rounded-xl px-4 py-2.5 text-sm font-extrabold text-slate-800 bg-white shadow-sm focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"/>
                             <div className="flex gap-2 mt-3 flex-wrap">
                                <button type="button" onClick={() => setDeliveryDate(getFutureDateStr(0))} className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 transition-colors">Today</button>
                                <button type="button" onClick={() => setDeliveryDate(getFutureDateStr(1))} className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 transition-colors">Tmrw</button>
                                <button type="button" onClick={() => setDeliveryDate(getFutureDateStr(2))} className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 transition-colors">2 Days</button>
                                <button type="button" onClick={() => setDeliveryDate(getFutureDateStr(3))} className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 transition-colors">3 Days</button>
                                <button type="button" onClick={() => setDeliveryDate(getFutureDateStr(5))} className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 transition-colors">5 Days</button>
                                <button type="button" onClick={() => setDeliveryDate(getFutureDateStr(7))} className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 transition-colors">1 Week</button>
                             </div>
                         </div>
                      </div>
                      
                      <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 shadow-inner flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
                              <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Total Amount</span>
                              <span className="text-3xl font-extrabold text-slate-900">₹{totalAmount.toFixed(2)}</span>
                          </div>
                          
                          <div className="mb-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CreditCard className="w-4 h-4"/> Payment History</h4>
                              {payments.length === 0 ? (
                                  <div className="text-sm text-center text-slate-400 font-medium py-3">No payments received yet.</div>
                              ) : (
                                  <div className="space-y-2.5">
                                      {payments.map((p, idx) => (
                                          <div key={p.id} className="flex justify-between items-center text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                              <span className="text-slate-600 font-medium">{idx + 1}. {p.date} ({p.mode})</span>
                                              <div className="flex items-center gap-3">
                                                  <span className="font-bold text-emerald-600">₹{p.amount}</span>
                                                  <button onClick={() => handleDeletePayment(p.id)} className="text-slate-400 hover:text-rose-500 bg-white p-1 rounded-md shadow-sm border border-slate-200 transition-colors"><X className="w-3 h-3"/></button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 text-base font-extrabold">
                                  <span className="text-slate-500">Total Paid:</span>
                                  <span className="text-emerald-600">₹{totalAdvance.toFixed(2)}</span>
                              </div>
                          </div>

                          <div className="grid grid-cols-12 md:flex md:items-center gap-2 mb-5 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="col-span-6 md:w-32 text-sm border border-slate-200 rounded-lg px-3 py-2 font-medium bg-white outline-none focus:border-blue-400" />
                              <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="col-span-6 md:flex-grow text-sm border border-slate-200 rounded-lg px-3 py-2 font-bold text-blue-700 bg-white outline-none focus:border-blue-400">{paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}</select>
                              <input 
                                type="number" 
                                placeholder="Amt" 
                                value={payAmount} 
                                onChange={(e) => setPayAmount(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
                                className="col-span-9 md:w-28 border border-slate-200 rounded-lg px-3 py-2 text-right text-sm bg-white outline-none font-bold focus:border-blue-400" 
                              />
                              <button onClick={handleAddPayment} className="col-span-3 md:w-auto flex items-center justify-center bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 transition-colors shadow-sm font-bold"><Plus className="w-4 h-4"/></button>
                          </div>
                          
                          <div className="border-t-2 border-slate-200 pt-4 flex justify-between items-center mt-auto">
                              <span className="text-rose-600 font-extrabold uppercase tracking-wide text-lg">Outstanding</span>
                              <span className="text-4xl font-black text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 shadow-sm tracking-tight">₹{outstanding.toFixed(2)}</span>
                          </div>
                      </div>
                   </div>
                </div>
                
                <div className="bg-white shadow-sm rounded-2xl p-6 lg:p-8 border border-slate-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                        <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Delivered & Cancelled</h3>
                        <div className="flex items-center gap-3">
                            <select 
                                value={deliveredFilterType} 
                                onChange={(e) => setDeliveredFilterType(e.target.value)}
                                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm cursor-pointer transition-all"
                            >
                                <option value="ALL">View All</option>
                                <option value="OUTSTANDING">Outstanding</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="TALLY">Tally Entry</option>
                            </select>
                            <button onClick={() => setShowDeliveredModal(true)} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors border border-slate-200 shadow-sm" title="Full Screen View">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search in Delivered/Cancelled..."
                            value={deliveredSearchTerm}
                            onChange={(e) => setDeliveredSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 text-sm bg-slate-50 font-medium text-slate-800 outline-none transition-all"
                        />
                        <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                        {deliveredSearchTerm && (
                            <X className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setDeliveredSearchTerm('')}/>
                        )}
                    </div>
                    
                    <div className="overflow-y-auto h-72 border border-slate-200 rounded-xl shadow-inner bg-slate-50/50">
                        <table className="min-w-full text-xs text-left text-slate-600">
                            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                                <tr>
                                    <th className="px-3 py-3">No.</th>
                                    <th className="px-3 py-3">Del. Date</th>
                                    <th className="px-3 py-3 min-w-[120px]">Customer</th>
                                    <th className="px-3 py-3 text-right">Total</th>
                                    <th className="px-3 py-3 text-right">Paid</th>
                                    <th className="px-3 py-3 text-right">Outst.</th>
                                    <th className="px-3 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {deliveredJobsContent}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className={`${isRegisterExpanded ? 'xl:col-span-5' : 'xl:col-span-2'} transition-all duration-300 ease-in-out`}>
                 <div className="bg-white shadow-sm rounded-2xl p-6 h-full flex flex-col border border-slate-200">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                        <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2"><Table className="w-5 h-5 text-blue-600" /> Active Register</h3>
                        <div className="flex gap-2">
                            <button onClick={handleDownloadAll} disabled={importing} className="text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm" title="Download Excel">
                                <Download className="w-4 h-4" /> {importing ? '...' : 'Excel'}
                            </button>
                            <button onClick={() => setRefreshKey(k => k + 1)} className="text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 p-2 rounded-xl transition-colors shadow-sm" title="Refresh"><RefreshCcw className="w-4 h-4"/></button>
                            <button onClick={() => setIsRegisterExpanded(!isRegisterExpanded)} className="text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 p-2 rounded-xl transition-colors shadow-sm" title={isRegisterExpanded ? "Minimize" : "Maximize"}>
                                {isRegisterExpanded ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col xl:flex-row gap-3 mb-4">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Search Active Jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 text-sm bg-slate-50 outline-none transition-all font-medium"
                            />
                            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                            {searchTerm && (
                                <X className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setSearchTerm('')}/>
                            )}
                        </div>
                        <div className="shrink-0">
                            <select 
                                value={activeStatusFilter} 
                                onChange={(e) => setActiveStatusFilter(e.target.value)}
                                className="w-full xl:w-auto text-xs font-bold bg-white border-2 border-slate-100 text-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 shadow-sm cursor-pointer transition-all"
                            >
                                <option value="ALL">All Status</option>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={`overflow-auto rounded-xl border border-slate-200 mb-2 relative shadow-inner bg-slate-50/50 ${isRegisterExpanded ? 'h-[75vh]' : 'h-[65vh]'}`}>
                        <table className="min-w-full text-xs text-left text-slate-600 relative">
                            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-20 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-3">No.</th>
                                    <th className="px-3 py-3">Date</th>
                                    <th className="px-3 py-3 w-[120px]">Particular</th>
                                    <th className="px-3 py-3 min-w-[140px]">Customer</th>
                                    <th className="px-3 py-3 text-right">Total</th>
                                    <th className="px-3 py-3 text-right">Paid</th>
                                    <th className="px-3 py-3 text-right">Outst.</th>
                                    <th className="px-3 py-3 text-center">Status / Info</th>
                                    <th className="px-3 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeJobsContent}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {viewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 print:hidden">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200">
              <div className="flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-xl">
                  <div className="flex flex-col">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700"><Eye className="w-5 h-5 text-indigo-600"/> Estimate જુઓ: {viewModalData.estNo}</h3>
                      {formatLastEditTime(viewModalData.updatedAt || viewModalData.createdAt) && (
                          <span className="text-[10px] text-slate-500 font-medium ml-7 mt-0.5">
                              છેલ્લે સુધારેલ (Last Edit): {formatLastEditTime(viewModalData.updatedAt || viewModalData.createdAt)}
                          </span>
                      )}
                  </div>
                  <button onClick={() => setViewModalData(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500"/></button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6 bg-slate-100">
                  <div className="border shadow-lg bg-white">
                    <PrintEstimate data={viewModalData} type="VIEW ONLY" />
                  </div>
              </div>

              <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-between gap-3">
                  <div className="flex gap-2">
                      <button onClick={() => setTimeout(() => window.print(), 200)} className="px-4 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                          <Printer className="w-4 h-4"/> Print Estimate (A5)
                      </button>
                      <button onClick={() => handlePrintTallyBill(viewModalData)} className="px-4 py-2 bg-slate-800 text-white font-bold hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                          <Printer className="w-4 h-4"/> Tally Bill (A4)
                      </button>
                  </div>
                  <button onClick={() => setViewModalData(null)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 bg-white border border-slate-300 rounded-lg transition-colors shadow-sm">બંધ કરો</button>
              </div>
           </div>
        </div>
      )}
      
      {showDailyReport && <DailyReportModal onClose={() => setShowDailyReport(false)} />}

      {showDeliveredModal && <DeliveredRegisterModal onClose={() => setShowDeliveredModal(false)} />}

      {showPrintingModal && (
          <PrintingVendorModal 
              data={showPrintingModal} 
              onAssign={handleAssignPrintingVendor} 
              onClose={() => setShowPrintingModal(null)} 
          />
      )}

      {showStatusReasonModal && (
          <StatusReasonModal 
            modalData={showStatusReasonModal} 
            onConfirm={handleConfirmReason} 
            onClose={() => setShowStatusReasonModal(null)} 
          />
      )}

      {ledgerCustomer && (
          <CustomerLedgerModal 
              customerName={ledgerCustomer}
              onClose={() => setLedgerCustomer(null)}
              onEditEstimate={(e, row) => {
                  handleEditEstimate(e, row);
                  setLedgerCustomer(null);
              }}
          />
      )}

      {showDesignModal && (
          <DesignerAssignmentModal 
              data={showDesignModal}
              onAssign={handleAssignDesigner}
              onClose={() => setShowDesignModal(null)}
          />
      )}

      {showOutstandingPaymentModal && (
          <OutstandingPaymentModal
              data={showOutstandingPaymentModal}
              onFinalize={handleFinalDelivery}
              onClose={() => setShowOutstandingPaymentModal(null)}
          />
      )}

      {showDashboardModal && <StatusDashboardModal onClose={() => setShowDashboardModal(false)} currentJobs={currentJobs} allJobs={history} onViewEstimate={(job) => handleEditEstimate(null, job)} onSaveAllAsPDF={handleSaveAllAsPDF} isAutoDownloading={isAutoDownloading} onSaveAsJpgZip={handleSaveAllAsJPGZip} isJpgGenerating={jpgProgress.isGenerating} />}

      {showRojmelPrompt && (
          <div className="fixed inset-0 z-[9600] flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 flex justify-between items-center text-white">
                      <h3 className="font-bold text-xl flex items-center gap-2"><FileBarChart className="w-6 h-6 text-yellow-300"/> રોજમેળ (Daily Report)</h3>
                      <button onClick={() => setShowRojmelPrompt(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 flex flex-col gap-4 bg-slate-50 text-center">
                      <div className="bg-teal-50 text-teal-900 p-4 rounded-lg font-bold text-sm border border-teal-200 shadow-inner">
                          સાંજના 6:02 વાગી ગયા છે. આજના દિવસનો રોજમેળ (Excel File) ડાઉનલોડ કરો અને WhatsApp પર શેર કરો.
                          <div className="mt-3 text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 p-2 rounded">
                              નોંધ: ફાઈલ ડાઉનલોડ થશે, જે તમારે WhatsApp ખુલ્યા પછી પિન આઇકન 📎 પર ક્લિક કરીને જાતે મોકલવી પડશે.
                          </div>
                      </div>
                      <button onClick={handleExportAndShareRojmel} disabled={importing} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm">
                          {importing ? "Processing..." : <><Download className="w-5 h-5"/> Excel ડાઉનલોડ કરી WP પર મોકલો</>}
                      </button>
                      <button onClick={() => {
                          localStorage.setItem('lastRojmelBackupDate', new Date().toISOString().split('T')[0]);
                          setShowRojmelPrompt(false);
                      }} className="text-slate-500 hover:text-slate-800 text-sm font-bold underline mt-2">
                          આજના દિવસ માટે ફરીથી યાદ ન કરાવો (Skip)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showJpgPrompt && (
          <div className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 flex justify-between items-center text-white">
                      <h3 className="font-bold text-xl flex items-center gap-2"><Moon className="w-6 h-6 text-yellow-400"/> સાંજનું ઓટો-બેકઅપ</h3>
                      <button onClick={() => setShowJpgPrompt(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 flex flex-col gap-4 bg-slate-50 text-center">
                      <div className="bg-indigo-100 text-indigo-800 p-4 rounded-lg font-bold text-sm border border-indigo-200">
                          સાંજના 6 વાગી ગયા છે. કૃપા કરીને આજના દિવસના બધા ઓર્ડરની JPG ઇમેજ આજની તારીખ (<b>{new Date().toLocaleDateString('en-IN')}</b>) ના ફોલ્ડરમાં સેવ કરી લો.
                      </div>
                      <button onClick={() => handleSaveAllAsJPGZip(new Date().toISOString().split('T')[0])} disabled={jpgProgress.isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                          <Download className="w-5 h-5"/> {jpgProgress.isGenerating ? "ડાઉનલોડ થઈ રહ્યું છે..." : "આજના ઓર્ડરનું ફોલ્ડર ડાઉનલોડ કરો"}
                      </button>
                      <button onClick={() => {
                          localStorage.setItem('lastJpgBackupDate', new Date().toISOString().split('T')[0]);
                          setShowJpgPrompt(false);
                      }} className="text-slate-500 hover:text-slate-800 text-sm font-bold underline mt-2">
                          આજના દિવસ માટે ફરીથી યાદ ન કરાવો (Skip)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showFullBackupPrompt && (
          <div className="fixed inset-0 z-[9700] flex items-center justify-center bg-black/80 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
                  <div className="bg-gradient-to-r from-rose-600 to-pink-700 p-5 flex justify-between items-center text-white">
                      <h3 className="font-bold text-xl flex items-center gap-2"><Database className="w-6 h-6 text-yellow-300"/> ડેટાબેઝ બેકઅપ (DB Backup)</h3>
                      <button onClick={() => setShowFullBackupPrompt(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 flex flex-col gap-4 bg-slate-50 text-center">
                      <div className="bg-rose-50 text-rose-900 p-4 rounded-lg font-bold text-sm border border-rose-200 shadow-inner">
                          સાંજના 6 વાગી ગયા છે. કૃપા કરીને <b>NOTES, STOCK અને STAFF Data</b> નો ફુલ બેકઅપ ડાઉનલોડ કરી લો.
                      </div>
                      <button onClick={() => handleFullDatabaseBackup(true)} disabled={importing} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm">
                          {importing ? "Processing..." : <><HardDrive className="w-5 h-5"/> Full DB Backup (Excel) ડાઉનલોડ કરો</>}
                      </button>
                      <button onClick={() => {
                          localStorage.setItem('lastFullDbBackupDate', new Date().toISOString().split('T')[0]);
                          setShowFullBackupPrompt(false);
                      }} className="text-slate-500 hover:text-slate-800 text-sm font-bold underline mt-2">
                          આજના દિવસ માટે ફરીથી યાદ ન કરાવો (Skip)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Shared Notes Modal */}
      {showNotesModal && <SharedNotesModal onClose={() => setShowNotesModal(false)} notes={sharedNotes} db={db} appId={appId} operatorName={operatorName} />}

      {/* Daily Expense Modal */}
      {showExpenseModal && <DailyExpenseModal onClose={() => setShowExpenseModal(false)} db={db} appId={appId} user={user} expenses={dailyExpenses} operatorName={operatorName} />}

      {/* Staff Management Modals */}
      {showDiaryModal && <WorkDiaryModal onClose={() => setShowDiaryModal(false)} db={db} appId={appId} user={user} staffProfiles={staffProfiles} staffEntries={staffEntries} staffAttendance={staffAttendance} staffTasks={staffTasks} />}
      {showStaffListModal && <StaffListModal onClose={() => setShowStaffListModal(false)} onSelect={(name) => { setShowStaffListModal(false); setShowStaffAccountModal(name); }} staffEntries={staffEntries} staffAttendance={staffAttendance} staffProfiles={staffProfiles} />}
      {showStaffAccountModal && <StaffAccountDetailModal staffName={showStaffAccountModal} onClose={() => setShowStaffAccountModal(null)} staffEntries={staffEntries} staffAttendance={staffAttendance} staffProfiles={staffProfiles} db={db} appId={appId} user={user} />}

      {showInventoryModal && <KankotriInventoryModal onClose={() => setShowInventoryModal(false)} inventory={kankotriInventory} db={db} appId={appId} history={history} />}

      {showGlobalSearch && <GlobalSearchModal onClose={() => setShowGlobalSearch(false)} history={history} onViewEstimate={handleViewEstimate} onEditEstimate={handleEditEstimate} isChutni={isChutni} />}

      {showPhoneMatchModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform transition-all">
                  <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2"><UserCheck className="w-5 h-5"/> ગ્રાહક મળેલ છે (Customer Found)</h3>
                      <button onClick={() => setShowPhoneMatchModal(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 bg-slate-50 flex flex-col gap-4">
                      <div className="text-center mb-2">
                          <p className="text-sm text-slate-600">આ નંબર પર છેલ્લો ઓર્ડર આપનાર ગ્રાહક:</p>
                          <h4 className="text-2xl font-extrabold text-indigo-900 mt-1">{showPhoneMatchModal.customerName}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-1">Last Est: {showPhoneMatchModal.estNo} | {showPhoneMatchModal.items?.[0]?.particular || 'N/A'}</p>
                      </div>
                      
                      <button 
                          onClick={() => { handleDuplicateEstimate(null, showPhoneMatchModal); setShowPhoneMatchModal(null); }}
                          className="flex items-center gap-3 bg-white hover:bg-indigo-50 border-2 border-indigo-200 p-3 rounded-xl transition-all shadow-sm group text-left"
                      >
                          <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Copy className="w-5 h-5"/></div>
                          <div>
                              <p className="font-bold text-indigo-900 text-sm">જૂનો ઓર્ડર રિપીટ કરો (Repeat Order)</p>
                              <p className="text-[10px] text-slate-500">ગ્રાહક અને જૂના કામની વિગતો કોપી થશે</p>
                          </div>
                      </button>

                      <button 
                          onClick={() => { setCustomerName(showPhoneMatchModal.customerName); setShowPhoneMatchModal(null); }}
                          className="flex items-center gap-3 bg-white hover:bg-emerald-50 border-2 border-emerald-200 p-3 rounded-xl transition-all shadow-sm group text-left"
                      >
                          <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Plus className="w-5 h-5"/></div>
                          <div>
                              <p className="font-bold text-emerald-900 text-sm">નવો ઓર્ડર (આ જ નામથી)</p>
                              <p className="text-[10px] text-slate-500">નામ '{showPhoneMatchModal.customerName}' રહેશે, કામ નવું</p>
                          </div>
                      </button>

                      <button 
                          onClick={() => { setCustomerName(''); setShowPhoneMatchModal(null); }}
                          className="flex items-center gap-3 bg-white hover:bg-amber-50 border-2 border-amber-200 p-3 rounded-xl transition-all shadow-sm group text-left"
                      >
                          <div className="bg-amber-100 text-amber-700 p-2 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><Edit className="w-5 h-5"/></div>
                          <div>
                              <p className="font-bold text-amber-900 text-sm">નામ બદલો (Change Name)</p>
                              <p className="text-[10px] text-slate-500">નામ જાતે લખવા માટે ખાલી કરો</p>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Loading Overlay when generating Auto PDF */}
      {isAutoDownloading && (
          <div className="fixed inset-0 z-[9999] bg-white/90 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mb-4"></div>
              <h2 className="text-2xl font-bold text-teal-900 drop-shadow-sm">PDF જનરેટ થઈ રહી છે...</h2>
              <p className="text-slate-600 mt-2 font-medium">બધા એસ્ટિમેટની ફાઈલ બની રહી છે, કૃપા કરીને થોડી રાહ જુઓ.</p>
          </div>
      )}

      {/* Loading Overlay when generating ZIP JPG Folder */}
      {jpgProgress.isGenerating && (
          <div className="fixed inset-0 z-[9999] bg-white/90 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
              <h2 className="text-2xl font-bold text-indigo-900 drop-shadow-sm">JPG ફોલ્ડર બની રહ્યું છે...</h2>
              <p className="text-slate-600 mt-2 font-medium mb-4">પસંદ કરેલ તારીખ ના ઓર્ડરની ઇમેજ બની રહી છે ({jpgProgress.current} / {jpgProgress.total})</p>
              <div className="w-64 bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300 shadow-inner">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${(jpgProgress.current / jpgProgress.total) * 100}%` }}></div>
              </div>
          </div>
      )}

      <div 
        id="print-all-container"
        className={(isAutoDownloading || jpgProgress.isGenerating) ? "absolute top-0 left-0 bg-white flex flex-col w-[210mm] z-[9000]" : "hidden print:block print:absolute print:top-0 print:left-0 bg-white w-[210mm] h-[148mm]"} 
      >
         {printingAll ? (
             exportJobs.map((job) => (
                 <div key={job.id} className="html2pdf__page-break flex items-center justify-center bg-white" style={{ width: '210mm', height: '148mm', pageBreakAfter: 'always', overflow: 'hidden', position: 'relative', margin: '0 auto' }}>
                     <div style={{ transform: 'scale(0.90)', transformOrigin: 'center', width: '210mm', height: '148mm', display: 'flex', flexDirection: 'column' }}>
                        <div className="flex-grow overflow-hidden">
                           <PrintEstimate data={job} type="CUSTOMER" />
                        </div>
                        <div className="h-[5mm] w-full flex items-center justify-center relative border-t-2 border-dashed border-gray-400 shrink-0 opacity-70 bg-white">
                           <div className="absolute left-8 -top-2.5 bg-white px-1 text-gray-500"><Scissors className="w-4 h-4"/></div>
                           <span className="bg-white px-2 text-[9px] text-gray-500 font-bold tracking-widest uppercase">✂ Cut Here (અહીંથી કાપો) ✂</span>
                        </div>
                     </div>
                 </div>
             ))
         ) : (
             <div className="flex items-center justify-center bg-white" style={{ width: '210mm', height: '148mm', overflow: 'hidden', position: 'relative', margin: '0 auto' }}>
                 <div style={{ transform: 'scale(0.90)', transformOrigin: 'center', width: '210mm', height: '148mm', display: 'flex', flexDirection: 'column' }}>
                     <div className="flex-grow overflow-hidden">
                         <PrintEstimate data={viewModalData} type="CUSTOMER" />
                     </div>
                     <div className="h-[5mm] w-full flex items-center justify-center relative border-t-2 border-dashed border-gray-400 shrink-0 opacity-70 bg-white">
                        <div className="absolute left-8 -top-2.5 bg-white px-1 text-gray-500"><Scissors className="w-4 h-4"/></div>
                        <span className="bg-white px-2 text-[9px] text-gray-500 font-bold tracking-widest uppercase">✂ Cut Here (અહીંથી કાપો) ✂</span>
                     </div>
                 </div>
             </div>
         )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&family=Roboto:wght@400;500;700&display=swap');
        .font-gujarati { font-family: 'Noto Sans Gujarati', sans-serif; }
        body { font-family: 'Roboto', Arial, sans-serif; background-color: #ecfeff; pointer-events: auto !important; }
        
        /* FIX: Enable text selection inside input fields */
        * { -webkit-user-select: auto; user-select: auto; }
        input, textarea, select { 
            -webkit-user-select: text !important; 
            user-select: text !important; 
            cursor: text !important; 
            pointer-events: auto !important;
        }

        /* FIX: Ensure header is always clickable and on top */
        .header-nav { pointer-events: auto !important; }
        
        /* FIX: Hide any unwanted generic external overlays */
        .overlay, .modal-backdrop, #loading-layer { display: none !important; pointer-events: none !important; z-index: -1 !important; }
        
        button, a, input, select { touch-action: manipulation; }

        @keyframes bounce-custom { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -5px); } }
        .animate-bounce-custom { animation: bounce-custom 0.5s infinite alternate; }
        @media print {
          @page { size: 210mm 148mm; margin: 0; }
          body { width: 210mm; height: 148mm; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden !important; background-color: #ffffff; }
          .print-logo { display: block !important; visibility: visible !important; max-width: 150px !important; height: auto !important; }
          .fixed.z-50 { display: none !important; } 
        }
      `}</style>
    </div>
  );
}
