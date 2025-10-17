"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { AIContentGenerator } from "@/components/ai-content-generator"
import type { DocumentNode } from "@/lib/db"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TemplateNodeData {
  node_id: string
  sequence_order: number
  ai_instructions: string
}

interface TemplateNodeBuilderProps {
  availableNodes: DocumentNode[]
  templateNodes: TemplateNodeData[]
  onTemplateNodesChange: (nodes: TemplateNodeData[]) => void
}

export function TemplateNodeBuilder({
  availableNodes,
  templateNodes,
  onTemplateNodesChange,
}: TemplateNodeBuilderProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  function addNode() {
    if (!selectedNodeId) return

    const newNode: TemplateNodeData = {
      node_id: selectedNodeId,
      sequence_order: templateNodes.length + 1,
      ai_instructions: "",
    }

    onTemplateNodesChange([...templateNodes, newNode])
    setSelectedNodeId("")
  }

  function removeNode(index: number) {
    const updated = templateNodes.filter((_, i) => i !== index)
    // Reorder sequence
    const reordered = updated.map((node, i) => ({
      ...node,
      sequence_order: i + 1,
    }))
    onTemplateNodesChange(reordered)
  }

  function moveNode(index: number, direction: "up" | "down") {
    if ((direction === "up" && index === 0) || (direction === "down" && index === templateNodes.length - 1)) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updated = [...templateNodes]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update sequence orders
    const reordered = updated.map((node, i) => ({
      ...node,
      sequence_order: i + 1,
    }))

    onTemplateNodesChange(reordered)
  }

  function updateInstructions(index: number, instructions: string) {
    const updated = [...templateNodes]
    updated[index] = { ...updated[index], ai_instructions: instructions }
    onTemplateNodesChange(updated)
  }

  function toggleExpanded(nodeId: string) {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  function getNodeName(nodeId: string): string {
    return availableNodes.find((n) => n.id === nodeId)?.name || "Unknown Section"
  }

  const usedNodeIds = new Set(templateNodes.map((tn) => tn.node_id))
  const availableToAdd = availableNodes.filter((node) => !usedNodeIds.has(node.id))

  return (
    <Card className="p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">Rule Sections</h3>
        <p className="text-muted-foreground">Add and sequence document sections with AI review instructions</p>
      </div>

      {/* Add Section */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <Label className="mb-2 block">Add Section to Rules</Label>
        <div className="flex gap-2">
          <Select value={selectedNodeId} onValueChange={setSelectedNodeId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a section to add" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addNode} disabled={!selectedNodeId}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Template Nodes List */}
      {templateNodes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No sections added yet. Add your first section to start building the rules.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templateNodes.map((templateNode, index) => {
            const node = availableNodes.find((n) => n.id === templateNode.node_id)
            const isExpanded = expandedNodes.has(templateNode.node_id)

            return (
              <Card key={`${templateNode.node_id}-${index}`} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveNode(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveNode(index, "down")}
                      disabled={index === templateNodes.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{templateNode.sequence_order}</Badge>
                        <h4 className="font-semibold text-foreground">{getNodeName(templateNode.node_id)}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(templateNode.node_id)}
                        >
                          {isExpanded ? "Collapse" : "Expand"}
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeNode(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {node?.description && <p className="text-sm text-muted-foreground mb-3">{node.description}</p>}

                    {isExpanded && (
                      <div className="space-y-2 mt-4">
                        <Label htmlFor={`instructions-${index}`}>AI Review Instructions</Label>
                        <div className="relative">
                          <Textarea
                            id={`instructions-${index}`}
                            value={templateNode.ai_instructions}
                            onChange={(e) => updateInstructions(index, e.target.value)}
                            placeholder="Provide specific instructions for the AI to follow when reviewing this section..."
                            rows={4}
                            className="pr-10"
                          />
                          <AIContentGenerator
                            value={templateNode.ai_instructions}
                            type="ai_instructions"
                            contextInfo={{ nodeName: getNodeName(templateNode.node_id) }}
                            onGenerate={(content) => updateInstructions(index, content)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          These instructions guide the AI on what to look for in this document section
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Card>
  )
}
