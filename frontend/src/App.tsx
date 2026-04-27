import React, { useState, useCallback } from 'react';
import { Upload, FileText, PieChart, AlertCircle, CheckCircle2, TrendingUp, DollarSign, Calendar, MapPin, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface Item {
  name: string;
  price: string;
  confidence: number;
}

interface ExtractionResult {
  data: {
    store_name: { value: string; confidence: number };
    date: { value: string | null; confidence: number };
    items: Item[];
    total_amount: { value: string | null; confidence: number };
  };
  metadata: {
    overall_confidence: number;
    needs_review: boolean;
  };
}

const API_BASE = 'http://localhost:5000/api';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please upload a valid image file.");
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to process receipt. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.85) return 'text-emerald-400';
    if (conf >= 0.7) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="blob top-[-10%] left-[-10%] bg-primary/20" />
        <div className="blob bottom-[-10%] right-[-10%] bg-secondary/20" style={{ animationDelay: '-5s' }} />
        <div className="blob top-[40%] left-[60%] w-[300px] h-[300px] bg-accent/10" style={{ animationDelay: '-10s' }} />
      </div>

      <main className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary font-medium text-sm"
          >
            <TrendingUp size={16} />
            <span>Intelligent Expense Analytics</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            Carbon <span className="gradient-text">Crunch</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Extract structured financial data from receipts with AI-powered OCR. 
            Automate your expense tracking in seconds.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Upload */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className={`
                relative aspect-video rounded-3xl border-2 border-dashed transition-all duration-500
                ${file ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/20 bg-white/5'}
                flex flex-col items-center justify-center p-8 text-center group cursor-pointer
                glass-morphism glass-morphism-hover
              `}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) setFile(selected);
                }}
              />
              
              <div className="mb-4 p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300">
                {file ? <CheckCircle2 className="text-primary" size={32} /> : <Upload className="text-muted-foreground" size={32} />}
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                {file ? file.name : "Drop your receipt here"}
              </h3>
              <p className="text-muted-foreground">
                or click to browse from your device
              </p>
              
              {file && (
                <div className="mt-4 flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors border border-gray-200"
                  >
                    Remove
                  </button>
                  <button 
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpload();
                    }}
                    className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    {loading ? <Loader2 className="animate-spin inline mr-2" size={16} /> : "Process Receipt"}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Quick Stats Placeholder or Instructions */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 rounded-2xl glass-morphism glass-morphism-hover space-y-2"
              >
                <div className="text-primary"><PieChart size={24} /></div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Average Accuracy</div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 rounded-2xl glass-morphism glass-morphism-hover space-y-2"
              >
                <div className="text-primary"><TrendingUp size={24} /></div>
                <div className="text-3xl font-bold">&lt; 2s</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Processing Time</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column: Results */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[450px] flex flex-col items-center justify-center space-y-6 glass-morphism border border-white/10"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="text-primary" size={24} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold tracking-tight">Analyzing Receipt...</p>
                    <p className="text-sm text-muted-foreground mt-1">Preprocessing, OCR, and Entity Extraction</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-morphism p-6 space-y-8"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        {result.data.store_name.value}
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 ${getConfidenceColor(result.data.store_name.confidence)}`}>
                          {(result.data.store_name.confidence * 100).toFixed(0)}%
                        </span>
                      </h2>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {result.data.date.value || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={14} /> Store Verified</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Overall confidence</div>
                      <div className={`text-2xl font-mono font-bold ${getConfidenceColor(result.metadata.overall_confidence)}`}>
                        {(result.metadata.overall_confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Line Items</div>
                    <div className="space-y-2">
                      {result.data.items.length > 0 ? result.data.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-black/5 hover:bg-black/10 transition-colors border border-black/5">
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-mono font-bold ${getConfidenceColor(item.confidence)}`}>
                              {(item.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="font-mono font-bold text-primary text-lg">${item.price}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-muted-foreground italic bg-white/5 rounded-lg">
                          No specific items could be parsed.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-black/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-xl font-bold">
                        <div className="p-2 rounded bg-primary/20 text-primary">
                          <DollarSign size={20} />
                        </div>
                        Total Amount
                      </div>
                      <div className="text-3xl font-mono font-bold">
                        ${result.data.total_amount.value || '0.00'}
                      </div>
                    </div>
                    {result.metadata.needs_review && (
                      <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-3">
                        <AlertCircle size={16} />
                        Low confidence detected. Please verify the extracted data.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[450px] border-2 border-dashed border-white/10 rounded-3xl glass-morphism flex flex-col items-center justify-center text-center p-12 text-muted-foreground group hover:border-primary/30 transition-colors"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <FileText size={64} className="mb-6 opacity-20 group-hover:opacity-40 transition-opacity" />
                  </motion.div>
                  <h4 className="text-lg font-semibold text-gray-500 mb-2">Ready for Extraction</h4>
                  <p className="max-w-[240px] text-sm">Upload a receipt on the left to see the AI magic happen here.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default App;
