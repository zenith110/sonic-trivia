import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CollectionFormProps {
  name: string;
  description: string;
  size: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSizeChange: (value: string) => void;
}

export function CollectionForm({
  name,
  description,
  size,
  onNameChange,
  onDescriptionChange,
  onSizeChange,
}: CollectionFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Information</CardTitle>
        <CardDescription>
          Basic details about your trivia collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="collectionName">Collection Name</Label>
          <Input
            id="collectionName"
            placeholder="e.g., Sonic Zones Trivia"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="collectionDescription">Description</Label>
          <Textarea
            id="collectionDescription"
            placeholder="Describe what this collection is about..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            required
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="collectionSize">Number of Questions</Label>
          <Input
            id="collectionSize"
            type="number"
            min="1"
            max="100"
            placeholder="10"
            value={size}
            onChange={(e) => onSizeChange(e.target.value)}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
}
