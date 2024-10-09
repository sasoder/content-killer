import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CommentaryList, DescriptionList } from "@/lib/types";

type EditorData = CommentaryList | DescriptionList;

interface JsonEditorProps {
  data: EditorData;
  onUpdate: (updatedData: EditorData) => void;
  title: string;
}

function JsonEditor({ data, onUpdate, title }: JsonEditorProps) {
  const [editedData, setEditedData] = useState<EditorData>(data);
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (rowIndex: number, key: string, value: string) => {
    const newData = { ...editedData };
    if ("comments" in newData) {
      newData.comments[rowIndex] = { ...newData.comments[rowIndex], [key]: value };
    } else if ("descriptions" in newData) {
      newData.descriptions[rowIndex] = { ...newData.descriptions[rowIndex], [key]: value };
    }
    setEditedData(newData);
  };

  const handleSave = () => {
    onUpdate(editedData);
    setIsOpen(false);
  };

  const getColumns = () => {
    if ("comments" in data && data.comments.length > 0) {
      return Object.keys(data.comments[0]);
    } else if ("descriptions" in data && data.descriptions.length > 0) {
      return Object.keys(data.descriptions[0]);
    }
    return [];
  };

  const getRows = () => {
    if ("comments" in editedData) {
      return editedData.comments;
    } else if ("descriptions" in editedData) {
      return editedData.descriptions;
    }
    return [];
  };

  const columns = getColumns();
  const rows = getRows();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{title}</Button>
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
                    <TableHead className="px-6" key={column}>
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
              {rows.map((row, rowIndex) => (
                <TableRow className="border-none hover:bg-transparent" key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column}`}>
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
