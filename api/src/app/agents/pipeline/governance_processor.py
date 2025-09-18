"""
Governance Dump Processor - Canonical Implementation
Integrates ImprovedP1SubstrateAgent with governance workflow for quality substrate extraction.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4

from app.agents.pipeline.improved_substrate_agent import ImprovedP1SubstrateAgent
from app.utils.supabase_client import supabase_admin_client as supabase

logger = logging.getLogger("uvicorn.error")


def _sanitize_for_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _sanitize_for_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize_for_json(v) for v in value]
    if isinstance(value, tuple):
        return [_sanitize_for_json(v) for v in value]
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


class GovernanceDumpProcessor:
    """
    Canonical governance processor using ImprovedP1SubstrateAgent for quality extraction.
    
    Creates governance proposals with high-quality substrate ingredients.
    """
    
    def __init__(self):
        self.logger = logger
        try:
            self.p1_agent = ImprovedP1SubstrateAgent()
        except RuntimeError as e:
            self.logger.error(f"Failed to initialize ImprovedP1SubstrateAgent: {e}")
            # Fall back to None - governance processor will handle gracefully
            self.p1_agent = None
        
    async def process_batch_dumps(self, dump_ids: List[UUID], basket_id: UUID, workspace_id: UUID) -> Dict[str, Any]:
        """
        Process multiple dumps through comprehensive governance review for Share Updates.
        
        Creates unified proposal from cross-content analysis of all provided dumps.
        """
        start_time = datetime.utcnow()
        
        try:
            # Validate P1 agent is available
            if not self.p1_agent:
                raise RuntimeError("ImprovedP1SubstrateAgent not initialized - likely missing OPENAI_API_KEY")
            
            # Canon purity: governance is mandatory; no direct substrate writes here.
            
            # Create comprehensive governance proposal with structured ingredients
            proposals_result = await self._create_batch_ingredient_proposals(
                dump_ids, basket_id, workspace_id, 20
            )
            
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            self.logger.info(
                f"Governance batch processing v2 completed: {len(dump_ids)} dumps, "
                f"proposals={proposals_result['proposals_created']}, "
                f"processing_time_ms={processing_time_ms}"
            )
            
            return {
                **proposals_result,
                "processing_time_ms": processing_time_ms,
                "batch_mode": True,
                "source_dumps": len(dump_ids)
            }
            
        except Exception as e:
            self.logger.error(f"Governance batch processing v2 failed for dumps {dump_ids}: {e}")
            raise
        
    async def process_dump(
        self, 
        dump_id: UUID, 
        basket_id: UUID, 
        workspace_id: UUID,
        max_blocks: int = 10
    ) -> Dict[str, Any]:
        """
        Process dump through governance with structured knowledge extraction.
        
        Creates governance proposals containing structured data ingredients.
        """
        start_time = datetime.utcnow()
        
        try:
            # Validate P1 agent is available
            if not self.p1_agent:
                raise RuntimeError("ImprovedP1SubstrateAgent not initialized - likely missing OPENAI_API_KEY")
            
            # Canon purity: governance is mandatory; no direct substrate writes here.
            
            # Create governance proposals with structured ingredients
            proposals_result = await self._create_ingredient_proposals(
                dump_id, basket_id, workspace_id, max_blocks
            )
            
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            self.logger.info(
                f"Governance dump processing v2 completed: dump_id={dump_id}, "
                f"proposals={proposals_result['proposals_created']}, "
                f"processing_time_ms={processing_time_ms}"
            )
            
            return {
                "dump_id": str(dump_id),
                "proposals_created": proposals_result["proposals_created"],
                "proposal_ids": proposals_result["proposal_ids"],
                "processing_time_ms": processing_time_ms,
                "confidence": proposals_result.get("avg_confidence", 0.0),
                "method": "quality_extraction_governance"
            }
            
        except Exception as e:
            self.logger.error(f"Governance dump processing failed for dump {dump_id}: {e}")
            raise
    
    async def _check_governance_enabled(self, workspace_id: UUID) -> bool:
        """Check if governance is enabled for workspace."""
        try:
            response = supabase.table("workspace_governance_settings").select(
                "governance_enabled"
            ).eq("workspace_id", str(workspace_id)).single().execute()
            
            if response.data:
                return response.data.get("governance_enabled", False)
            else:
                # Default to governance enabled for new workspaces
                return True
                
        except Exception as e:
            self.logger.warning(f"Failed to check governance settings: {e}")
            return True  # Fail safe to governance
    
    async def _create_ingredient_proposals(
        self,
        dump_id: UUID,
        basket_id: UUID, 
        workspace_id: UUID,
        max_blocks: int
    ) -> Dict[str, Any]:
        """
        Create governance proposals containing structured knowledge ingredients.
        """
        try:
            # Use improved P1 Agent to extract quality ingredients
            substrate_result = await self.p1_agent.create_substrate({
                "dump_id": str(dump_id),
                "workspace_id": str(workspace_id),
                "basket_id": str(basket_id),
                "max_blocks": max_blocks,
                "agent_id": "canonical_governance_processor"
            })
            substrate_result = _sanitize_for_json(substrate_result)
            
            # Convert substrate results into governance proposals
            proposals = []
            proposal_ids = []

            # Prefer non-persisted ingredients in strict mode; fall back to persisted blocks
            blocks_source = substrate_result.get("block_ingredients") or substrate_result.get("blocks_created", [])

            # Sort by confidence desc and cap to max_blocks for signal density
            def _conf(b: Dict[str, Any]) -> float:
                try:
                    return float(b.get("confidence") if b.get("confidence") is not None else b.get("confidence_score", 0.7))
                except Exception:
                    return 0.7
            try:
                blocks_source = sorted(blocks_source, key=_conf, reverse=True)[: max(1, int(max_blocks))]
            except Exception:
                blocks_source = blocks_source[: max(1, int(max_blocks))]

            # Sparse, high-confidence context items only
            allowed_entity_types = {"project", "goal", "task", "endpoint", "concept", "person"}
            created_ci_labels: set[str] = set()
            max_context_items_total = max(4, min(12, len(blocks_source)))
            context_items_added = 0

            # Create proposals for each block ingredient
            for block_data in blocks_source:
                # Normalize fields between ingredient (confidence) and persisted (confidence_score)
                confidence = block_data.get("confidence") if isinstance(block_data, dict) else None
                if confidence is None:
                    confidence = block_data.get("confidence_score", 0.7)
                metadata = _sanitize_for_json(block_data.get("metadata", {}))
                if isinstance(block_data, dict):
                    block_data["metadata"] = metadata
                semantic_type = block_data.get("semantic_type")
                title = block_data.get("title")
                # Build ops: always include CreateBlock, optionally a few CreateContextItem
                ops_list: List[Dict[str, Any]] = [{
                    "type": "CreateBlock",
                    "data": {
                        "title": title,
                        "semantic_type": semantic_type,
                        "metadata": metadata,
                        "confidence": confidence
                    }
                }]

                # Derive at most one high-confidence, allowed-type context item per block
                try:
                    if context_items_added < max_context_items_total:
                        entities = metadata.get("knowledge_ingredients", {}).get("entities", [])
                        def _econf(e: Dict[str, Any]) -> float:
                            try:
                                return float(e.get("confidence", 0.0))
                            except Exception:
                                return 0.0
                        entities = sorted(entities, key=_econf, reverse=True)
                        for ent in entities:
                            label = (ent.get("name") or ent.get("title") or "").strip()
                            etype = (ent.get("type") or "").lower()
                            econf = _econf(ent)
                            if not label or econf < 0.8 or etype not in allowed_entity_types or label.lower() in created_ci_labels:
                                continue
                            ops_list.append({
                                "type": "CreateContextItem",
                                "data": {
                                    "label": label,
                                    "content": ent.get("description") or label,
                                    "kind": etype or "concept",
                                    "confidence": econf
                                }
                            })
                            created_ci_labels.add(label.lower())
                            context_items_added += 1
                            break
                except Exception:
                    # ignore CI derivation errors
                    pass

                # Build impact summary for validator report compliance
                ingredient_counts = metadata.get("knowledge_ingredients", {})
                impact_summary = (
                    f"block + {len(ops_list) - 1} context items"  # -1 because first op is CreateBlock
                )
                if ingredient_counts:
                    summary_bits: List[str] = []
                    for key in ("goals", "constraints", "metrics", "entities"):
                        items = ingredient_counts.get(key, [])
                        if isinstance(items, list) and items:
                            summary_bits.append(f"{len(items)} {key}")
                    if summary_bits:
                        impact_summary = ", ".join(summary_bits)

                proposal_data = {
                    "basket_id": str(basket_id),
                    "workspace_id": str(workspace_id),
                    "proposal_kind": "Extraction",
                    "origin": "agent",
                    "provenance": [{"dump_id": str(dump_id), "method": "structured_extraction_v2"}],
                    "ops": ops_list,
                    "blast_radius": "Local",
                    "validator_report": {
                        "confidence": confidence,
                        "method": "structured_knowledge_extraction",
                        "ingredients_count": len(metadata.get("knowledge_ingredients", {}).get("entities", [])),
                        "extraction_quality": "high" if confidence and confidence > 0.7 else "medium",
                        "impact_summary": impact_summary
                    },
                    "status": "PROPOSED"
                }
                
                response = supabase.table("proposals").insert(_sanitize_for_json(proposal_data)).execute()
                if response.data:
                    inserted_records = [_sanitize_for_json(record) for record in response.data]
                    proposals.extend(inserted_records)
                    proposal_ids.extend([
                        str(record["id"]) for record in inserted_records if record.get("id") is not None
                    ])

                    # Auto-approval logic per Canon v2.2: Agent origin + confidence > 0.7 → Auto-approved
                    for proposal in inserted_records:
                        await self._check_auto_approval(proposal)
            
            return {
                "proposals_created": len(proposals),
                "proposal_ids": proposal_ids,
                "avg_confidence": substrate_result.get("agent_confidence", 0.0)
            }
            
        except Exception as e:
            self.logger.exception("Failed to create ingredient proposals")
            return {
                "proposals_created": 0,
                "proposal_ids": [],
                "avg_confidence": 0.0
            }
    
    async def _create_batch_ingredient_proposals(
        self,
        dump_ids: List[UUID], 
        basket_id: UUID, 
        workspace_id: UUID, 
        max_blocks: int
    ) -> Dict[str, Any]:
        """Create unified governance proposal from comprehensive batch analysis."""
        
        try:
            # Use improved P1 Agent batch mode for comprehensive analysis
            agent_request = {
                "dump_ids": [str(did) for did in dump_ids],
                "workspace_id": str(workspace_id),
                "basket_id": str(basket_id),
                "agent_id": f"canonical_governance_batch_{uuid4().hex[:8]}",
                "max_blocks": max_blocks
            }
            
            substrate_result = await self.p1_agent.create_substrate(agent_request)
            blocks_created = _sanitize_for_json(
                substrate_result.get("block_ingredients") or substrate_result.get("blocks_created", [])
            )
            
            if not blocks_created:
                return {
                    "proposals_created": 0,
                    "status": "no_substrate_from_batch",
                    "message": f"No structured ingredients extracted from {len(dump_ids)} dumps"
                }
            
            # Create single unified proposal
            proposal_id = await self._create_unified_governance_proposal(
                basket_id, workspace_id, blocks_created, dump_ids
            )
            
            return {
                "proposals_created": 1,
                "proposal_ids": [str(proposal_id)],
                "substrate_candidates": len(blocks_created),
                "comprehensive_analysis": True,
                "source_dumps": len(dump_ids)
            }
            
        except Exception as e:
            self.logger.exception("Failed to create batch ingredient proposals")
            return {
                "proposals_created": 0,
                "proposal_ids": [],
                "comprehensive_analysis": False
            }
    
    async def _direct_substrate_creation(
        self,
        dump_id: UUID,
        basket_id: UUID,
        workspace_id: UUID,
        max_blocks: int
    ) -> Dict[str, Any]:
        """
        Direct substrate creation when governance is disabled.
        Uses improved agent but bypasses proposal workflow.
        """
        try:
            # Use improved P1 Agent directly
            result = await self.p1_agent.create_substrate({
                "dump_id": str(dump_id),
                "workspace_id": str(workspace_id),
                "basket_id": str(basket_id),
                "max_blocks": max_blocks,
                "agent_id": "direct_processor_v2"
            })
            
            return {
                "dump_id": str(dump_id),
                "proposals_created": 0,  # No proposals, direct creation
                "blocks_created": len(result.get("blocks_created", [])),
                "context_items_created": len(result.get("context_items_created", [])),
                "processing_time_ms": result.get("processing_time_ms"),
                "confidence": result.get("agent_confidence"),
                "method": "direct_quality_extraction"
            }
            
        except Exception as e:
            self.logger.error(f"Direct substrate creation failed: {e}")
            raise
    
    async def _create_unified_governance_proposal(
        self,
        basket_id: UUID,
        workspace_id: UUID, 
        blocks_created: List[Dict[str, Any]],
        dump_ids: List[UUID]
    ) -> UUID:
        """Create single unified proposal for comprehensive batch processing."""
        
        sanitized_blocks: List[Dict[str, Any]] = []
        for block in blocks_created:
            sanitized_blocks.append({
                **block,
                "metadata": _sanitize_for_json(block.get("metadata", {})),
            })

        # Generate comprehensive summary
        summary_parts = []
        total_goals = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("goals", [])) for block in sanitized_blocks)
        total_constraints = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("constraints", [])) for block in sanitized_blocks)
        total_metrics = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("metrics", [])) for block in sanitized_blocks)
        total_entities = sum(len(block.get("metadata", {}).get("knowledge_ingredients", {}).get("entities", [])) for block in sanitized_blocks)
        
        summary_parts.append(f"Comprehensive analysis of {len(dump_ids)} content sources")
        if total_goals > 0:
            summary_parts.append(f"{total_goals} strategic goals identified")
        if total_constraints > 0:
            summary_parts.append(f"{total_constraints} operational constraints") 
        if total_metrics > 0:
            summary_parts.append(f"{total_metrics} measurable success criteria")
        if total_entities > 0:
            summary_parts.append(f"{total_entities} key stakeholders and systems")
            
        ops_summary = "; ".join(summary_parts)
        
        # Translate blocks into an array of CreateBlock operations
        ops: List[Dict[str, Any]] = []
        confidences: List[float] = []
        for b in sanitized_blocks:
            conf = b.get("confidence") if isinstance(b, dict) else None
            if conf is None:
                conf = b.get("confidence_score", 0.7)
            try:
                confidences.append(float(conf))
            except Exception:
                confidences.append(0.7)
            ops.append({
                "type": "CreateBlock",
                "data": {
                    "title": b.get("title"),
                    "semantic_type": b.get("semantic_type"),
                    "metadata": _sanitize_for_json(b.get("metadata", {})),
                    "confidence": conf
                }
            })

        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        # Create unified proposal data using canonical ops[] array
        proposal_data = {
            "id": str(uuid4()),
            "workspace_id": str(workspace_id),
            "basket_id": str(basket_id),
            "proposal_kind": "Extraction",
            "origin": "agent",
            "status": "PROPOSED",
            "ops": ops,
            "metadata": {
                "batch_mode": True,
                "source_dumps": len(dump_ids),
                "comprehensive_review": True,
                "processing_method": "share_updates_batch",
                "ops_summary": ops_summary
            },
            "validator_report": {
                "confidence": avg_confidence,
                "method": "structured_knowledge_batch",
                "ingredients_count": total_entities,
                "impact_summary": ops_summary or "batch substrate extraction"
            }
        }
        
        response = supabase.table("proposals").insert(_sanitize_for_json(proposal_data)).execute()

        if not response.data:
            raise RuntimeError("Failed to create unified governance proposal")

        inserted_record = _sanitize_for_json(response.data[0])
        proposal_id = UUID(str(inserted_record.get("id")))
        self.logger.info(
            "Created unified proposal %s from %d dumps",
            proposal_id,
            len(dump_ids)
        )

        # Auto-approval logic per Canon v2.2: Agent origin + confidence > 0.7 → Auto-approved
        await self._check_auto_approval(inserted_record)

        return proposal_id
    
    async def _check_auto_approval(self, proposal: Dict[str, Any]) -> bool:
        """
        Check if proposal meets auto-approval criteria per Canon v2.2:
        Agent origin + confidence > 0.7 → Auto-approved
        """
        try:
            # Check auto-approval criteria
            origin = proposal.get("origin")
            validator_report = proposal.get("validator_report", {})
            confidence = validator_report.get("confidence", 0.0) if isinstance(validator_report, dict) else 0.0
            
            should_auto_approve = (
                origin == "agent" and 
                confidence > 0.7
            )
            
            if should_auto_approve:
                proposal_id = str(proposal["id"])
                self.logger.info(f"Auto-approving proposal {proposal_id} (origin={origin}, confidence={confidence})")
                
                # Update proposal status to APPROVED
                supabase.table("proposals").update({
                    "status": "APPROVED",
                    "reviewed_at": datetime.utcnow().isoformat(),
                    "review_notes": f"Auto-approved: agent origin with confidence {confidence:.3f} > 0.7"
                }).eq("id", proposal_id).execute()
                
                # Execute the proposal operations
                await self._execute_proposal_operations(proposal)
                
                # Update status to EXECUTED
                supabase.table("proposals").update({
                    "status": "EXECUTED"
                }).eq("id", proposal_id).execute()
                
                self.logger.info(f"Auto-approved and executed proposal {proposal_id}")
                return True
            else:
                self.logger.info(f"Proposal {proposal['id']} requires manual review (origin={origin}, confidence={confidence})")
                return False
                
        except Exception as e:
            self.logger.error(f"Auto-approval check failed for proposal {proposal.get('id')}: {e}")
            return False
    
    async def _execute_proposal_operations(self, proposal: Dict[str, Any]) -> None:
        """Execute the operations in an approved proposal to create substrate."""
        try:
            proposal_id = proposal["id"]
            ops = proposal.get("ops", [])
            basket_id = proposal.get("basket_id")
            workspace_id = proposal.get("workspace_id")
            
            self.logger.info(f"Executing {len(ops)} operations for proposal {proposal_id}")
            
            executed_operations = []
            
            for i, op in enumerate(ops):
                op_type = (op.get("type") if isinstance(op, dict) else None) or (op.get("operation_type") if isinstance(op, dict) else None)
                op_data = op.get("data", op) if isinstance(op, dict) else op
                try:
                    if op_type == "CreateBlock":
                        metadata = _sanitize_for_json(op_data.get("metadata") or {})
                        title = op_data.get("title") or metadata.get("title") or "Untitled insight"
                        semantic_type = op_data.get("semantic_type") or metadata.get("semantic_type") or "insight"
                        confidence = op_data.get("confidence") or metadata.get("confidence") or 0.7
                        body_source = op_data.get("body_md") or op_data.get("content") or metadata.get("summary") or ""
                        body = body_source if isinstance(body_source, str) else str(body_source)

                        rpc_response = supabase.rpc('fn_block_create', {
                            "p_basket_id": str(basket_id),
                            "p_workspace_id": str(workspace_id),
                            "p_title": title,
                            "p_body_md": body,
                        }).execute()

                        if rpc_response.error:
                            raise RuntimeError(f"fn_block_create failed: {rpc_response.error.message}")

                        block_id = rpc_response.data
                        if isinstance(block_id, list):
                            block_id = block_id[0]
                        elif isinstance(block_id, dict):
                            block_id = next(iter(block_id.values()), None)
                        if not block_id:
                            raise RuntimeError("fn_block_create returned no id")

                        update_payload = _sanitize_for_json({
                            "semantic_type": semantic_type,
                            "metadata": metadata,
                            "confidence_score": confidence,
                            "state": "ACCEPTED"
                        })

                        update_resp = (
                            supabase
                            .table("blocks")
                            .update(update_payload)
                            .eq("id", str(block_id))
                            .select('*')
                            .execute()
                        )
                        if update_resp.error:
                            raise RuntimeError(f"Failed to finalize block {block_id}: {update_resp.error.message}")

                        created_id = update_resp.data[0]["id"] if update_resp.data else block_id

                        executed_operations.append({
                            "type": "CreateBlock",
                            "success": True,
                            "created_id": created_id
                        })

                    elif op_type == "CreateContextItem":
                        metadata = _sanitize_for_json(op_data.get("metadata") or {})
                        synonyms = op_data.get("synonyms") or metadata.get("synonyms") or []
                        label = op_data.get("label") or op_data.get("title") or "Untitled context"
                        normalized_label = label.lower()
                        confidence = op_data.get("confidence") or metadata.get("confidence") or 0.7
                        summary = metadata.get("summary")
                        summary_text = summary if isinstance(summary, str) or summary is None else str(summary)
                        metadata["synonyms"] = synonyms

                        rpc_response = supabase.rpc('fn_context_item_upsert_bulk', {
                            "p_items": [
                                {
                                    "basket_id": str(basket_id),
                                    "type": op_data.get("kind") or metadata.get("kind") or "concept",
                                    "title": label,
                                    "content": summary_text,
                                    "description": metadata.get("description"),
                                    "metadata": metadata,
                                }
                            ]
                        }).execute()

                        if rpc_response.error:
                            raise RuntimeError(f"fn_context_item_upsert_bulk failed: {rpc_response.error.message}")

                        context_id = rpc_response.data
                        if isinstance(context_id, list):
                            context_id = context_id[0]
                        elif isinstance(context_id, dict):
                            context_id = next(iter(context_id.values()), None)
                        if not context_id:
                            raise RuntimeError("fn_context_item_upsert_bulk returned no id")

                        update_resp = (
                            supabase
                            .table("context_items")
                            .update(_sanitize_for_json({
                            "normalized_label": normalized_label,
                            "confidence_score": confidence,
                            "metadata": metadata,
                            "content": summary_text,
                            "state": "ACTIVE"
                        }))
                            .eq("id", str(context_id))
                            .select('*')
                            .execute()
                        )

                        if update_resp.error:
                            raise RuntimeError(f"Failed to finalize context item {context_id}: {update_resp.error.message}")

                        created_id = update_resp.data[0]["id"] if update_resp.data else context_id

                        executed_operations.append({
                            "type": "CreateContextItem", 
                            "success": True,
                            "created_id": created_id
                        })
                    
                    else:
                        self.logger.warning(f"Unsupported operation type: {op_type}")
                        
                except Exception as op_error:
                    self.logger.error(f"Failed to execute operation {i}: {op_error}")
                    executed_operations.append({
                        "type": op_type,
                        "success": False,
                        "error": str(op_error)
                    })
            
            # Record execution results; tolerate older schema variants
            execution_summary = {
                "executed": executed_operations,
                "success_count": len([op for op in executed_operations if op.get("success")])
            }
            execution_payload = _sanitize_for_json({
                "proposal_id": str(proposal_id),
                "operations_count": len(ops),
                "operations_summary": execution_summary
            })

            try:
                exec_resp = supabase.table("proposal_executions").insert(execution_payload).execute()
                if getattr(exec_resp, "error", None):
                    raise RuntimeError(exec_resp.error)
            except Exception as exec_error:
                error_text = str(exec_error)
                if "operations_count" in error_text:
                    self.logger.warning(
                        "proposal_executions table missing operations_count column; recording summary without count"
                    )
                    fallback_payload = _sanitize_for_json({
                        "proposal_id": str(proposal_id),
                        "operations_summary": execution_summary
                    })
                    try:
                        supabase.table("proposal_executions").insert(fallback_payload).execute()
                    except Exception as fallback_error:
                        self.logger.warning(
                            "Failed to persist proposal execution summary fallback: %s",
                            fallback_error
                        )
                else:
                    self.logger.warning(
                        "Failed to persist proposal execution summary for proposal %s: %s",
                        proposal_id,
                        exec_error
                    )
            
            self.logger.info(f"Completed execution of proposal {proposal_id}: {len(executed_operations)} operations")
            
        except Exception as e:
            self.logger.error(f"Failed to execute proposal operations: {e}")
            raise
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get processor information."""
        return {
            "name": "GovernanceDumpProcessorV2",
            "pipeline": "P1_GOVERNANCE_V2",
            "type": "governance_processor",
            "status": "active",
            "substrate_agent": self.p1_agent.agent_name,
            "extraction_method": "structured_knowledge_ingredients",
            "version": "2.0_data_ingredients"
        }
