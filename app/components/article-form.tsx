import React, { useState, useEffect } from 'react';
import { useToast } from "@/app/components/toast-provider"
import { Image, Video, FileText } from "lucide-react"

interface ArticleFormProps {
  article?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  titleAm: string;
  content: string;
  contentAm: string;
  excerpt: string;
  status: string;
  language: string;
  categoryId: string;
  authorId: string;
  publishedAt: string;
  expiresAt: string;
  tags: string[];
}

const ArticleForm: React.FC<ArticleFormProps> = ({ article, onSubmit, onCancel, mode }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    titleAm: '',
    content: '',
    contentAm: '',
    excerpt: '',
    status: 'DRAFT',
    language: 'EN',
    categoryId: '',
    authorId: '',
    publishedAt: '',
    expiresAt: '',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show: toast } = useToast()
  const [language] = useState<"en" | "am">("en")
  const [files, setFiles] = useState<File[]>([])

  // Load categories and authors using your exact pattern
  useEffect(() => {
    let active = true;
    
    async function loadCategories() {
      setLoadingData(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/categories`,{
           headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
        });
        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (active) {
          // Handle different possible response structures
          setCategories(data.categories || data || []);
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load categories");
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadCategories();

    
    return () => { active = false; };
  }, []);

  // Initialize form with article data if in edit mode
  useEffect(() => {
    if (article && mode === 'edit') {
      setFormData({
        title: article.title || '',
        titleAm: article.titleAm || '',
        content: article.content || '',
        contentAm: article.contentAm || '',
        excerpt: article.excerpt || '',
        status: article.status || 'DRAFT',
        language: article.language || 'EN',
        categoryId: article.categoryId || '',
        authorId: article.authorId || '',
        publishedAt: article.publishedAt ? article.publishedAt.split('T')[0] : '',
        expiresAt: article.expiresAt ? article.expiresAt.split('T')[0] : '',
        tags: article.tags || [],
      });
    }
  }, [article, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Use type assertion to fix the TypeScript error
    setFormData(prev => ({
      ...prev,
      [name]: value
    } as FormData));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    const allFiles = Array.from(e.target.files);
    const validFiles: File[] = [];
    const tooLarge: File[] = [];

    allFiles.forEach((file) => {
      if (file.size <= maxSizeBytes) {
        validFiles.push(file);
      } else {
        tooLarge.push(file);
      }
    });

    setFiles(validFiles);

    if (tooLarge.length > 0) {
      toast({
        title: "Some files were too large",
        description: `Maximum size is 10 MB per file. Rejected: ${tooLarge
          .map((f) => f.name)
          .join(", ")}`,
        variant: "destructive",
      });
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  try {
    // Only allow DRAFT and PUBLISHED status - map everything else to DRAFT
    const validStatus = formData.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    // Create the submit data object with only confirmed working fields
    const submitData: any = {
      title: formData.title,
      content: formData.content,
      status: validStatus, // Only DRAFT or PUBLISHED
      language: formData.language,
      categoryId: formData.categoryId,
    };

    // Only include optional fields if they have values
    if (formData.titleAm?.trim()) submitData.titleAm = formData.titleAm;
    if (formData.contentAm?.trim()) submitData.contentAm = formData.contentAm;
    if (formData.excerpt?.trim()) submitData.excerpt = formData.excerpt;

    // Include tags if any
    if (formData.tags && formData.tags.length > 0) {
      submitData.tags = formData.tags;
    }

    // Get auth token
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null;

    const url =
      mode === "edit"
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/articles/${article.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/articles`;

    const method = mode === "edit" ? "PATCH" : "POST";

    console.log("Final submit data:", JSON.stringify(submitData, null, 2));

    let headers: HeadersInit = {};
    if (token) headers = { ...headers, Authorization: `Bearer ${token}` };

    let body: BodyInit;
    if (mode === "edit") {
      headers = { ...headers, "Content-Type": "application/json" };
      body = JSON.stringify(submitData);
    } else {
      const formDataToSend = new FormData();
      Object.entries(submitData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item) => {
            formDataToSend.append(key, String(item));
          });
        } else {
          formDataToSend.append(key, String(value));
        }
      });

      files.forEach((file) => {
        formDataToSend.append("files", file);
      });

      body = formDataToSend;
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      let errorMessage = `Failed to ${mode === "edit" ? "update" : "create"} article`;

      try {
        const errorText = await response.text();
        if (errorText) {
          const errorDetails = JSON.parse(errorText);
          errorMessage =
            errorDetails.message ||
            errorDetails.error ||
            errorMessage;

          if (errorDetails.details) {
            errorMessage += ` - Validation: ${JSON.stringify(
              errorDetails.details
            )}`;
          }
        }
      } catch (parseError) {
        console.error("Could not parse error response:", parseError);
      }

      // Show error toast
      toast({
        title:language === "en" ? "Error" : "አስተያየት",
        description: errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Show success toast
    toast({
      title: language === "en" ? "Success" : "ተሳክቷል",
      description:
        language === "en"
          ? `Article ${mode === "edit" ? "updated" : "created"} successfully`
          : `ጽሁፍ በተሳካ ሁኔታ ${mode === "edit" ? "ተዘምኗል" : "ተፈጥሯል"}`,
    });

    // Call the onSubmit prop with the result
    onSubmit(result);
  } catch (error: any) {
    console.error("Form submission error:", error);
    // Already shown toast for API errors
  } finally {
    setLoading(false);
  }
};



  if (loadingData) {
    return (
      <div className="w-full h-full p-4 sm:p-6 bg-white overflow-y-auto">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <span className="ml-3 text-lg">Loading form data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-4 sm:p-6 bg-white overflow-y-auto">
      {error && (
        <div
          className={`mb-6 p-4 border rounded-lg ${
            error.includes("✅")
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === "create" ? "Create Article" : "Edit Article"}
        </h2>

        <div className="space-y-6">
          {/* Main article content */}
          <div className="space-y-4">
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm md:text-base ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Article Title"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}

            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={10}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm md:text-base min-h-[220px] ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Write your article here..."
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          {/* Article details below */}
          <div className="w-full max-w-md">
            <div className="border border-gray-200 rounded-xl bg-slate-50 p-4 space-y-4">
              <div className="text-sm font-semibold text-gray-900">Article Details</div>

              {/* Category */}
              <div className="space-y-1">
                <label
                  htmlFor="categoryId"
                  className="block text-xs font-medium text-gray-600"
                >
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoryId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-red-600">{errors.categoryId}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Enter tags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="w-3 h-3 flex items-center justify-center rounded-full bg-blue-200 hover:bg-blue-300 text-[10px]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Attach files
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium cursor-pointer hover:bg-blue-700">
                    Choose files
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={loading || files.length === 0}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (!files.length) return;
                      toast({
                        title: "Files attached",
                        description: "Your files will be uploaded when you save the article.",
                      });
                    }}
                  >
                    Upload
                  </button>
                  {files.length > 0 && (
                    <p className="text-[11px] text-gray-500">
                      {files.length} file{files.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label
                  htmlFor="status"
                  className="block text-xs font-medium text-gray-600"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              {/* Save / Cancel */}
              <div className="pt-2 flex flex-col md:flex-row gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto inline-flex justify-center items-center px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? mode === "edit"
                      ? "Saving..."
                      : "Saving..."
                    : "Save Article"}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
};

export default ArticleForm;