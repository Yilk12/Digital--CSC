"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LetterTemplate } from "./letter-template";
import { Upload, X } from "lucide-react";

export default function LetteringReportForm() {
  const [formData, setFormData] = useState({
    senderDept: "Ethiopian Civil Service Commission",
    senderOrg: "ECSC",
    senderAddress: "Addis Ababa, Ethiopia",
    senderContact: "+251-11-123-4567",
    date: new Date().toLocaleDateString(),
    receiverDept: "",
    subject: "",
    receiverName: "",
    receiverTitle: "",
    body: "",
    actionDeadline: "",
    senderName: "",
    senderTitle: "",
    senderDeptName: "",
    digitalSignature: "",
    stampUrl: "/gallery/FCSC.jpg",
    certId: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [uploadedSignature, setUploadedSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  // List of ECSC internal departments
  const receiverDepartments = [
    "Office of the Commissioner",
    "Deputy Commissioner Office",
    "Human Resource Management Directorate",
    "Policy and Planning Directorate",
    "Service Delivery Directorate",
    "Information Technology Directorate",
    "Finance and Administration Directorate",
    "Legal Affairs Directorate",
    "Internal Audit Directorate",
    "Public Relations and Communication Directorate",
    "Capacity Building Directorate",
    "Performance Management Directorate",
    "Research and Development Directorate",
    "Regional Coordination Directorate",
    "Gender and Social Affairs Directorate",
    "Ethics and Integrity Directorate",
    "Strategic Planning Directorate",
    "Monitoring and Evaluation Directorate",
    "International Cooperation Directorate",
    "Civil Service Reform Directorate",
    "Digital Transformation Directorate",
    "Quality Assurance Directorate",
    "Compliance Directorate",
    "Innovation and Modernization Directorate"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedSignature(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSignaturePreview(result);
        setFormData(prev => ({ ...prev, digitalSignature: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSignature = () => {
    setUploadedSignature(null);
    setSignaturePreview("");
    setFormData(prev => ({ ...prev, digitalSignature: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const handleReset = () => {
    setFormData({
      senderDept: "Ethiopian Civil Service Commission",
      senderOrg: "ECSC",
      senderAddress: "Addis Ababa, Ethiopia",
      senderContact: "+251-11-123-4567",
      date: new Date().toLocaleDateString(),
      receiverDept: "",
      subject: "",
      receiverName: "",
      receiverTitle: "",
      body: "",
      actionDeadline: "",
      senderName: "",
      senderTitle: "",
      senderDeptName: "",
      digitalSignature: "",
      stampUrl: "/gallery/FCSC.jpg",
      certId: "",
    });
    setUploadedSignature(null);
    setSignaturePreview("");
    setShowPreview(false);
  };

  return (
    <div className="space-y-6" style={{ width: "100%" }}>
      <Card style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <CardHeader>
          <CardTitle>Letter & Report Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sender Department - Fixed */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Label className="text-sm font-medium text-blue-800">Sender Department (Fixed)</Label>
              <div className="mt-1 text-lg font-semibold text-blue-900">
                {formData.senderDept}
              </div>
              <div className="text-sm text-blue-700">
                {formData.senderOrg} • {formData.senderAddress} • {formData.senderContact}
              </div>
            </div>

            {/* Sender Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  value={formData.senderName}
                  onChange={(e) => handleInputChange("senderName", e.target.value)}
                  placeholder="Enter sender name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderTitle">Sender Title</Label>
                <Input
                  id="senderTitle"
                  value={formData.senderTitle}
                  onChange={(e) => handleInputChange("senderTitle", e.target.value)}
                  placeholder="Enter sender title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderDeptName">Department Name</Label>
                <Input
                  id="senderDeptName"
                  value={formData.senderDeptName}
                  onChange={(e) => handleInputChange("senderDeptName", e.target.value)}
                  placeholder="Enter department name"
                />
              </div>
              <div className="space-y-2">
                <Label>Digital Signature Upload</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="flex-1"
                  />
                  {signaturePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeSignature}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {signaturePreview && (
                  <div className="mt-2">
                    <img
                      src={signaturePreview}
                      alt="Signature Preview"
                      className="h-16 w-32 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Receiver Information */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-0">
                <strong>Internal Communication:</strong> Select the ECSC department to receive this letter
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiverDept">Receiver Department (Internal)</Label>
                <Select
                  value={formData.receiverDept}
                  onValueChange={(value) => handleInputChange("receiverDept", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select internal department" />
                  </SelectTrigger>
                  <SelectContent>
                    {receiverDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiverName">Receiver Name</Label>
                <Input
                  id="receiverName"
                  value={formData.receiverName}
                  onChange={(e) => handleInputChange("receiverName", e.target.value)}
                  placeholder="Enter receiver name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiverTitle">Receiver Title</Label>
                <Select
                  value={formData.receiverTitle}
                  onValueChange={(value) => handleInputChange("receiverTitle", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Prof.">Prof.</SelectItem>
                    <SelectItem value="Hon.">Hon.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder="Enter subject"
                />
              </div>
            </div>

            {/* Letter Content */}
            <div className="space-y-2">
              <Label htmlFor="body">Letter Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => handleInputChange("body", e.target.value)}
                placeholder="Enter letter content"
                rows={6}
              />
            </div>

            {/* Action Deadline */}
            <div className="space-y-2">
              <Label htmlFor="actionDeadline">Action Deadline (Optional)</Label>
              <Input
                id="actionDeadline"
                type="date"
                value={formData.actionDeadline}
                onChange={(e) => handleInputChange("actionDeadline", e.target.value)}
              />
            </div>

            {/* Certificate ID */}
            <div className="space-y-2">
              <Label htmlFor="certId">Certificate ID (Optional)</Label>
              <Input
                id="certId"
                value={formData.certId}
                onChange={(e) => handleInputChange("certId", e.target.value)}
                placeholder="Enter certificate ID"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Generate Letter
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Letter Preview */}
      {showPreview && (
        <Card style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
          <CardHeader>
            <CardTitle>Letter Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <LetterTemplate {...formData} />
            <div className="mt-4 flex gap-4">
              <Button className="bg-green-600 hover:bg-green-700">
                Download PDF
              </Button>
              <Button variant="outline">
                Print Letter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
