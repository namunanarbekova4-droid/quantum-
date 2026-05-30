"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Bell, BellOff, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatDateTime } from "@/lib/utils";

interface Alert {
  id: string;
  topic: string;
  keywords: string[];
  frequency: string;
  active: boolean;
  lastFired: string | null;
  triggerCount: number;
}

export default function AlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newFreq, setNewFreq] = useState("DAILY");

  const toggle = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));

  const remove = (id: string) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id));

  const create = () => {
    if (!newTopic.trim()) return;
    setAlerts((prev) => [
      ...prev,
      {
        id: `alert_${Date.now()}`,
        topic: newTopic,
        keywords: [newTopic.toLowerCase()],
        frequency: newFreq as "REALTIME" | "DAILY" | "WEEKLY",
        active: true,
        lastFired: null,
        triggerCount: 0,
      },
    ]);
    setNewTopic("");
    setCreateOpen(false);
  };

  const freqVariant = (f: string) =>
    f === "REALTIME" ? "danger" : f === "DAILY" ? "gold" : "neutral";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.alerts.title}</h1>
          <p className="text-text-secondary mt-1">{t.alerts.subtitle}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> {t.alerts.newAlert}
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-8 space-y-3">
        {alerts.length === 0 && (
          <Card className="p-14 text-center">
            <Bell className="w-8 h-8 text-[#333333] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">{t.alerts.noAlerts}</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto leading-relaxed">
              {t.alerts.noAlertsDesc}
            </p>
            <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm" className="gap-2">
              <Plus className="w-3.5 h-3.5" /> {t.alerts.createFirstAlert}
            </Button>
          </Card>
        )}
        {alerts.map((alert) => (
          <Card key={alert.id} className={`p-5 transition-opacity ${!alert.active ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${alert.active ? "bg-gold/10 text-gold" : "bg-[#1a1a1a] text-text-secondary"}`}>
                {alert.active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white">{alert.topic}</p>
                  <Badge variant={freqVariant(alert.frequency)}>{alert.frequency}</Badge>
                </div>
                <p className="text-xs text-text-secondary mt-1">{alert.keywords.join(" · ")}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                  <span>{t.alerts.lastTriggered} {alert.lastFired ? formatDateTime(alert.lastFired) : t.alerts.never}</span>
                  <span className="font-mono text-text-secondary">{alert.triggerCount} {t.alerts.totalTriggers}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggle(alert.id)}
                  className={`relative w-10 h-5 rounded-full transition-all duration-200 ${alert.active ? "bg-gold" : "bg-[#2a2a2a]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${alert.active ? "left-5" : "left-0.5"}`} />
                </button>
                <button onClick={() => remove(alert.id)} className="p-2 text-text-secondary hover:text-danger transition-colors rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t.alerts.createNewAlert} size="sm">
        <div className="p-6 space-y-4">
          <Input
            label={t.alerts.topic}
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder={t.alerts.topicPlaceholder}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">{t.alerts.frequency}</label>
            <select
              value={newFreq}
              onChange={(e) => setNewFreq(e.target.value)}
              className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
            >
              <option value="REALTIME">{t.alerts.realtime}</option>
              <option value="DAILY">{t.alerts.daily}</option>
              <option value="WEEKLY">{t.alerts.weekly}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">{t.common.cancel}</Button>
            <Button onClick={create} disabled={!newTopic.trim()} className="flex-1">{t.alerts.createAlert}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
