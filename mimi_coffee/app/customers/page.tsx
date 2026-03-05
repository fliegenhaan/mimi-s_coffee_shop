"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppLayout } from "../components/layout/app-layout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Plus, Search, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { CustomerWithTags, InterestTag, CreateCustomerBody, UpdateCustomerBody } from "@/types";

const ITEMS_PER_PAGE = 5;

export default function CustomersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithTags[]>([]);
  const [allTags, setAllTags] = useState<InterestTag[]>([]);
  const [search, setSearch] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithTags | null>(null);
  const [form, setForm] = useState<{
    name: string;
    contact: string;
    favourite_product: string;
    tag_ids: string[];
  }>({
    name: "",
    contact: "",
    favourite_product: "",
    tag_ids: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersData, tagsData] = await Promise.all([
        api.getCustomers({ search: "", tags: "", page: 1, limit: 100 }),
        api.getTags(),
      ]);

      setCustomers(customersData.customers || []);
      setAllTags(tagsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomers = async () => {
    try {
      const data = await api.getCustomers({
        search: search || undefined,
        tags: filterTags.join(",") || undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });

      // Update customers in the list
      if (search || filterTags.length > 0) {
        // If filtering, we need to refetch all to get accurate count
        const allCustomers = await api.getCustomers({ limit: 1000 });
        setCustomers(allCustomers.customers || []);
      } else {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Failed to refresh customers:", error);
      toast.error("Failed to refresh customers");
    }
  };

  // Filter clients-side for immediate feedback
  const filtered = customers.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.favourite_product.toLowerCase().includes(search.toLowerCase());
    const matchesTags =
      filterTags.length === 0 ||
      filterTags.some((t) => c.tags.some((tag) => tag.id === t));
    return matchesSearch && matchesTags;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openCreate = () => {
    setEditingCustomer(null);
    setForm({ name: "", contact: "", favourite_product: "", tag_ids: [] });
    setDialogOpen(true);
  };

  const openEdit = (c: CustomerWithTags) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      contact: c.contact || "",
      favourite_product: c.favourite_product,
      tag_ids: c.tags.map((t) => t.id),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.favourite_product.trim()) {
      toast.error("Name and favorite product are required");
      return;
    }

    if (form.tag_ids.length === 0) {
      toast.error("Please select at least one tag");
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        // Update
        const updateData: UpdateCustomerBody = {
          name: form.name,
          contact: form.contact || undefined,
          favourite_product: form.favourite_product,
          tag_ids: form.tag_ids,
        };

        await api.updateCustomer(editingCustomer.id, updateData);
        toast.success("Customer updated successfully");

        // Update local state
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                  ...c,
                  name: form.name,
                  contact: form.contact || null,
                  favourite_product: form.favourite_product,
                }
              : c
          )
        );
      } else {
        // Create
        const createData: CreateCustomerBody = {
          name: form.name,
          contact: form.contact || undefined,
          favourite_product: form.favourite_product,
          tag_ids: form.tag_ids,
        };

        await api.createCustomer(createData);
        toast.success("Customer created successfully");

        // Refresh to get the new customer with proper ID
        await refreshCustomers();
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast.error("Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      await api.deleteCustomer(id);
      toast.success("Customer deleted successfully");
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const toggleFormTag = (tagId: string) => {
    setForm((f) => ({
      ...f,
      tag_ids: f.tag_ids.includes(tagId)
        ? f.tag_ids.filter((t) => t !== tagId)
        : [...f.tag_ids, tagId],
    }));
  };

  const toggleFilterTag = (tagId: string) => {
    setFilterTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
    setPage(1);
  };

  if (status === "loading" || loading) {
    return (
      <AppLayout title="Customers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Customers">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} customers</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Customer
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-9 bg-card"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={filterTags.includes(tag.id) ? "accent" : "outline"}
                className="cursor-pointer text-xs transition-colors"
                onClick={() => toggleFilterTag(tag.id)}
              >
                {tag.name}
                {filterTags.includes(tag.id) && <X className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Favorite Product
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Tags</TableHead>
                  <TableHead className="text-xs font-semibold">Contact</TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id} className="hover:bg-accent">
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.favourite_product}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {c.tags.map((t, tagIndex) => (
                          <Badge
                            key={t.id}
                            variant={tagIndex % 2 === 0 ? "secondary" : "accent"}
                            className="text-xs"
                          >
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.contact || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-accent"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-sans">
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Contact</Label>
                <Input
                  type="email"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Favorite Product</Label>
                <Input
                  value={form.favourite_product}
                  onChange={(e) =>
                    setForm({ ...form, favourite_product: e.target.value })
                  }
                  placeholder="e.g., Oat Milk Latte"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Tags (select at least one)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={form.tag_ids.includes(tag.id) ? "accent" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleFormTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
