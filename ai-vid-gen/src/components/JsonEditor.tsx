import { useState, FormEvent, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { TimestampTextList, TimestampText } from "@/lib/schema";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface JsonEditorProps {
  data: TimestampTextList;
  onUpdate: (updatedData: TimestampTextList) => void;
  title: string;
}

export default function JsonEditor({ data, onUpdate, title }: JsonEditorProps) {
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
    handleSave(true);
  };

  const handleNewRowInputChange = (key: keyof TimestampText, value: string) => {
    setNewRow({ ...newRow, [key]: value });
    handleSave(true);
  };

  const handleSave = (remainOpen: boolean = false, newData: TimestampTextList = editedData) => {
    console.log("Saving changes...");
    const invalidTimestamps = newData.items.filter((item) => !validateTimestamp(item.timestamp));
    if (invalidTimestamps.length > 0) {
      toast({
        title: "Invalid Timestamps",
        description: "Please correct all timestamps before saving.",
        variant: "destructive",
      });
      return;
    }
    onUpdate(newData);
    setIsOpen(remainOpen);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDelete = (rowIndex: number) => {
    const newData = { ...editedData };
    newData.items = newData.items.filter((_, index) => index !== rowIndex);
    setEditedData(newData);
    handleSave(true, newData);
  };

  const handleAdd = () => {
    if (newRow.timestamp === "" && newRow.text === "") {
      return;
    }
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
        description: "Please use the format mm:ss (e.g., 05:30)",
        variant: "destructive",
      });
      return;
    }

    const newData = { ...editedData };
    const insertIndex = newData.items.findIndex((item) => item.timestamp > newRow.timestamp);

    if (insertIndex === -1) {
      newData.items.push({ ...newRow });
    } else {
      newData.items.splice(insertIndex, 0, { ...newRow });
    }

    handleSave(true, newData);
    setNewRow({ timestamp: "", text: "" });
  };

  const columns: (keyof TimestampText)[] = ["timestamp", "text"];

  const handleSubmitNewRow = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAdd();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {editedData.items.length > 0 ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Icons.pencil className="h-[1.1rem] w-[1.1rem]" />
          </Button>
        </DialogTrigger>
      ) : (
        <Button variant="outline" size="icon" disabled>
          <Icons.pencil className="h-[1.1rem] w-[1.1rem]" />
        </Button>
      )}
      <DialogContent className="max-w-[70vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky z-10 top-0 bg-background border-b">
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center p-6">
              <DialogTitle>{title}</DialogTitle>
              <Button onClick={() => handleSave(false)}>Save Changes</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead className={`px-4 ${column === "timestamp" ? "w-12" : "w-full"}`} key={column}>
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-4 pb-8">
          <form onSubmit={handleSubmitNewRow}>
            <Table>
              <TableBody>
                {/* Add Row */}
                <TableRow className="border-none hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell className={column === "timestamp" ? "w-16" : "w-full"} key={`new-${column}`}>
                      <Textarea
                        value={newRow[column]}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => handleNewRowInputChange(column, e.target.value)}
                        placeholder={column === "timestamp" ? "mm:ss" : `New ${column}`}
                        className={column === "timestamp" ? "w-16 min-h-[2rem] resize-none text-center px-0" : "w-full h-20 resize-none"}
                        rows={1}
                      />
                    </TableCell>
                  ))}
                  {/* Actions Cell for Add Row */}
                  <TableCell className="w-20">
                    <Button type="submit" variant="ghost" size="icon" onClick={handleAdd}>
                      <Icons.plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Existing Data Rows */}
                {editedData.items.map((row, rowIndex) => (
                  <TableRow className="border-none hover:bg-transparent" key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell className={column === "timestamp" ? "w-16" : "w-full"} key={`${rowIndex}-${column}`}>
                        <Textarea
                          value={row[column]}
                          onChange={(e) => handleInputChange(rowIndex, column, e.target.value)}
                          onKeyDown={handleKeyDown}
                          className={column === "timestamp" ? "w-16 min-h-[2rem] resize-none text-center px-0" : "w-full h-20 resize-none"}
                          rows={1}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="w-20">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rowIndex)}>
                        <Icons.minus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
