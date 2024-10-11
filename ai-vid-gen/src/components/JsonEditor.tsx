import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { TimestampTextList, TimestampText } from "@/lib/types";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface JsonEditorProps {
  data: TimestampTextList;
  onUpdate: (updatedData: TimestampTextList) => void;
  title: string;
}

function JsonEditor({ data, onUpdate, title }: JsonEditorProps) {
  const [editedData, setEditedData] = useState<TimestampTextList>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [newRow, setNewRow] = useState<TimestampText>({ timestamp: "", text: "" });
  const { toast } = useToast();

  const validateTimestamp = (timestamp: string): boolean => {
    const regex = /^([0-5][0-9]):([0-5][0-9])$/;
    return regex.test(timestamp);
  };

  const handleInputChange = (rowIndex: number, key: keyof TimestampText, value: string) => {
    const newData = { ...editedData };
    newData.items[rowIndex] = { ...newData.items[rowIndex], [key]: value };
    setEditedData(newData);
  };

  const handleNewRowInputChange = (key: keyof TimestampText, value: string) => {
    setNewRow({ ...newRow, [key]: value });
  };

  const handleSave = () => {
    const invalidTimestamps = editedData.items.filter((item) => !validateTimestamp(item.timestamp));
    if (invalidTimestamps.length > 0) {
      toast({
        title: "Invalid Timestamps",
        description: "Please correct all timestamps before saving.",
        variant: "destructive",
      });
      return;
    }
    onUpdate(editedData);
    setIsOpen(false);
  };

  const handleDelete = (rowIndex: number) => {
    const newData = { ...editedData };
    newData.items = newData.items.filter((_, index) => index !== rowIndex);
    setEditedData(newData);
  };

  const handleAdd = () => {
    if (newRow.timestamp === "" || newRow.text === "") {
      toast({
        title: "Incomplete Data",
        description: "Please fill in both timestamp and text fields before adding a new row.",
        variant: "destructive",
      });
      return;
    }

    if (!validateTimestamp(newRow.timestamp)) {
      toast({
        title: "Invalid Timestamp",
        description: "Please use the format MM:SS (e.g., 05:30)",
        variant: "destructive",
      });
      return;
    }

    const newData = { ...editedData };
    const insertIndex = newData.items.findIndex((item) => item.timestamp > newRow.timestamp);

    if (insertIndex === -1) {
      newData.items.push(newRow);
    } else {
      newData.items.splice(insertIndex, 0, newRow);
    }

    setEditedData(newData);
    setNewRow({ timestamp: "", text: "" });
  };

  const columns: (keyof TimestampText)[] = ["timestamp", "text"];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div>
          <Button variant="outline" size="icon" disabled={editedData.items.length === 0}>
            <Icons.pencil className="h-[1.1rem] w-[1.1rem]" />
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky z-10 top-0 bg-background border-b">
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center p-6">
              <DialogTitle>{title}</DialogTitle>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead className={`px-6 ${column === "timestamp" ? "w-40" : ""}`} key={column}>
                      {column}
                    </TableHead>
                  ))}
                  <TableHead className="px-6 w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-0">
          <Table>
            <TableBody>
              <TableRow className="border-none hover:bg-transparent">
                {columns.map((column) => (
                  <TableCell className={column === "timestamp" ? "w-40" : ""} key={`new-${column}`}>
                    <Input
                      value={newRow[column]}
                      onChange={(e) => handleNewRowInputChange(column, e.target.value)}
                      placeholder={column === "timestamp" ? "MM:SS" : `New ${column}`}
                    />
                  </TableCell>
                ))}
                <TableCell className="w-16">
                  <Button variant="ghost" size="icon" onClick={handleAdd}>
                    <Icons.plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              {editedData.items.map((row, rowIndex) => (
                <TableRow className="border-none hover:bg-transparent" key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell className={column === "timestamp" ? "w-40" : ""} key={`${rowIndex}-${column}`}>
                      <Input value={row[column]} onChange={(e) => handleInputChange(rowIndex, column, e.target.value)} />
                    </TableCell>
                  ))}
                  <TableCell className="w-16">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rowIndex)}>
                      <Icons.minus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default JsonEditor;
