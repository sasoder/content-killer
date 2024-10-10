import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { TimestampDescriptionList } from "@/lib/types";

interface JsonEditorProps {
  data: TimestampDescriptionList;
  onUpdate: (updatedData: TimestampDescriptionList) => void;
  title: string;
}

function JsonEditor({ data, onUpdate, title }: JsonEditorProps) {
  const [editedData, setEditedData] = useState<TimestampDescriptionList>(data);
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (rowIndex: number, key: string, value: string) => {
    const newData = { ...editedData };
    newData.items[rowIndex] = { ...newData.items[rowIndex], [key]: value };
    setEditedData(newData);
  };

  const handleSave = () => {
    onUpdate(editedData);
    setIsOpen(false);
  };

  const columns = Object.keys(editedData.items[0] || {});

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex justify-center items-center">
          <Button variant="outline" disabled={editedData.items.length === 0}>
            {title}
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
                    <TableHead className={`px-6 ${column.toLowerCase() === "timestamp" ? "w-40" : ""}`} key={column}>
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-0">
          <Table>
            <TableBody>
              {editedData.items.map((row, rowIndex) => (
                <TableRow className="border-none hover:bg-transparent" key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell className={column.toLowerCase() === "timestamp" ? "w-40" : ""} key={`${rowIndex}-${column}`}>
                      <Input
                        value={row[column as keyof typeof row]}
                        onChange={(e) => handleInputChange(rowIndex, column, e.target.value)}
                      />
                    </TableCell>
                  ))}
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
