"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@myapp/ui/components/card";
import { Label } from "@myapp/ui/components/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@myapp/ui/components/select";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import { Input } from "@myapp/ui/components/input";
import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";

interface CoupangCred {
  id: string;
  alias: string;
  isActive: boolean;
  accessKey: string;
  vendorId: string;
  vendorUserId: string;
  createdAt: string;
}

interface ShippingCenter {
  code: string;
  name: string;
  address?: string;
  usable?: boolean;
}

export function SettingsPage() {
  const t = useTranslations("SettingsPage");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [current, setCurrent] = useState<string | undefined>(theme);

  // Coupang state
  const [creds, setCreds] = useState<CoupangCred[]>([]);
  const [credsLoading, setCredsLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCred, setNewCred] = useState({ alias: "", accessKey: "", secretKey: "", vendorId: "", vendorUserId: "" });
  const [saving, setSaving] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);
  const [outboundCenters, setOutboundCenters] = useState<ShippingCenter[]>([]);
  const [returnCenters, setReturnCenters] = useState<ShippingCenter[]>([]);
  const [centersError, setCentersError] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(theme);
  }, [theme]);

  const fetchCreds = useCallback(async () => {
    try {
      setCredsLoading(true);
      const res = await fetch("/api/settings/coupang");
      const data = await res.json();
      setCreds(data.credentials || []);
    } catch {
      setCreds([]);
    } finally {
      setCredsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreds();
  }, [fetchCreds]);

  const handleSwitch = async (id: string) => {
    setSwitching(id);
    try {
      await fetch("/api/settings/coupang", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: true }),
      });
      await fetchCreds();
      setOutboundCenters([]);
      setReturnCenters([]);
    } finally {
      setSwitching(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 API 키를 삭제하시겠습니까?")) return;
    await fetch(`/api/settings/coupang?id=${id}`, { method: "DELETE" });
    await fetchCreds();
  };

  const handleAdd = async () => {
    if (!newCred.accessKey || !newCred.secretKey || !newCred.vendorId) return;
    setSaving(true);
    try {
      await fetch("/api/settings/coupang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCred, isActive: creds.length === 0 }),
      });
      setNewCred({ alias: "", accessKey: "", secretKey: "", vendorId: "", vendorUserId: "" });
      setShowAdd(false);
      await fetchCreds();
    } finally {
      setSaving(false);
    }
  };

  const fetchCenters = async () => {
    setCentersLoading(true);
    setCentersError(null);
    try {
      const [retRes, outRes] = await Promise.all([
        fetch("/api/coupang/return-centers"),
        fetch("/api/coupang/centers"),
      ]);
      const retData = await retRes.json();
      const outData = await outRes.json();

      if (!retRes.ok) {
        setCentersError(`반품지 조회 실패 (${retRes.status}): ${JSON.stringify(retData.coupang?.message || retData.error || "")}`);
      }

      const retList = retData?.coupang?.data?.content || retData?.data?.return || [];
      setReturnCenters(retList.map((c: any) => ({
        code: c.returnCenterCode || c.returnCenterId || "",
        name: c.shippingPlaceName || "",
        address: c.placeAddresses?.[0]?.returnAddress || "",
        usable: c.usable,
      })));

      const outList = outData?.data?.outbound || [];
      setOutboundCenters(outList.map((c: any) => ({
        code: c.outboundShippingPlaceCode || c.shippingPlaceId || "",
        name: c.shippingPlaceName || "",
        address: c.placeAddresses?.[0]?.returnAddress || "",
        usable: c.usable,
      })));
    } catch (err: any) {
      setCentersError(err.message);
    } finally {
      setCentersLoading(false);
    }
  };

  const activeCred = creds.find((c) => c.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {/* Coupang API Management */}
      <Card>
        <CardHeader>
          <CardTitle>쿠팡 API 관리</CardTitle>
          <CardDescription>등록된 쿠팡 셀러 계정을 관리하고 활성 스토어를 전환합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credsLoading ? (
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          ) : creds.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 API 키가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {creds.map((cred) => (
                <div
                  key={cred.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    cred.isActive ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cred.alias || "이름 없음"}</span>
                      {cred.isActive && <Badge variant="default">활성</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      <span>Vendor: {cred.vendorId}</span>
                      <span>Key: {cred.accessKey}</span>
                      {cred.vendorUserId && <span>User: {cred.vendorUserId}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!cred.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={switching === cred.id}
                        onClick={() => handleSwitch(cred.id)}
                      >
                        {switching === cred.id ? "전환 중..." : "활성화"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cred.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new credential */}
          {showAdd ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h4 className="font-medium text-sm">새 쿠팡 API 키 등록</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">별칭 (스토어 이름)</Label>
                  <Input
                    placeholder="예: 메인스토어"
                    value={newCred.alias}
                    onChange={(e) => setNewCred({ ...newCred, alias: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Vendor ID *</Label>
                  <Input
                    placeholder="A01XXXXXX"
                    value={newCred.vendorId}
                    onChange={(e) => setNewCred({ ...newCred, vendorId: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Access Key *</Label>
                  <Input
                    placeholder="Access Key"
                    value={newCred.accessKey}
                    onChange={(e) => setNewCred({ ...newCred, accessKey: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Secret Key *</Label>
                  <Input
                    type="password"
                    placeholder="Secret Key"
                    value={newCred.secretKey}
                    onChange={(e) => setNewCred({ ...newCred, secretKey: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Vendor User ID</Label>
                  <Input
                    placeholder="선택사항"
                    value={newCred.vendorUserId}
                    onChange={(e) => setNewCred({ ...newCred, vendorUserId: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleAdd} disabled={saving || !newCred.accessKey || !newCred.secretKey || !newCred.vendorId}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>취소</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
              + 새 API 키 등록
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Shipping Centers */}
      {activeCred && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>배송지 정보</CardTitle>
                <CardDescription>
                  <span className="font-medium">{activeCred.alias || activeCred.vendorId}</span> 의 출고지/반품지
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchCenters} disabled={centersLoading}>
                {centersLoading ? "조회 중..." : "조회하기"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {centersError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {centersError}
              </div>
            )}

            {outboundCenters.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">출고지</h4>
                <div className="space-y-2">
                  {outboundCenters.map((c) => (
                    <div key={c.code} className="text-sm p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">{c.name}</span>
                        {c.address && <span className="text-muted-foreground ml-2">{c.address}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {returnCenters.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">반품지</h4>
                <div className="space-y-2">
                  {returnCenters.map((c) => (
                    <div key={c.code} className="text-sm p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">{c.name}</span>
                        {c.address && <span className="text-muted-foreground ml-2">{c.address}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!centersLoading && outboundCenters.length === 0 && returnCenters.length === 0 && !centersError && (
              <p className="text-sm text-muted-foreground">'조회하기' 버튼을 눌러 배송지를 확인하세요.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("appearance.title")}</CardTitle>
          <CardDescription>{t("appearance.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor="theme-select">{t("appearance.theme")}</Label>
            <Select
              value={current}
              onValueChange={(value) => {
                setCurrent(value);
                setTheme(value);
              }}
            >
              <SelectTrigger id="theme-select">
                <SelectValue placeholder={t("appearance.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("appearance.light")}</SelectItem>
                <SelectItem value="dark">{t("appearance.dark")}</SelectItem>
                <SelectItem value="system">{t("appearance.system")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("appearance.current", { value: resolvedTheme || "system" })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
