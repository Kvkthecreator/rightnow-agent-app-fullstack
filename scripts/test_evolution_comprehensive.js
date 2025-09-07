const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEvolutionComprehensive() {
  try {
    console.log('🧪 Comprehensive Evolution Agent Test...\n');
    
    // Find a basket with blocks to test block evolution
    const { data: baskets } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .limit(10);
    
    let basketWithBlocks = null;
    
    for (const basket of baskets || []) {
      const { data: blocks } = await supabase
        .from('blocks')
        .select('id, content, semantic_type')
        .eq('basket_id', basket.id)
        .limit(1);
        
      if (blocks && blocks.length > 0) {
        basketWithBlocks = basket;
        console.log(`📦 Found basket with blocks: ${basket.id}`);
        
        // Show existing blocks
        const { data: allBlocks } = await supabase
          .from('blocks')
          .select('id, content, semantic_type, confidence_score')
          .eq('basket_id', basket.id);
          
        console.log(`   Current blocks (${allBlocks?.length || 0}):`);
        allBlocks?.forEach(block => {
          console.log(`      - ${block.semantic_type}: ${block.content?.substring(0, 80)}...`);
        });
        
        // Show existing context items
        const { data: items } = await supabase
          .from('context_items')
          .select('id, normalized_label, type, metadata')
          .eq('basket_id', basket.id);
          
        console.log(`   Current context items (${items?.length || 0}):`);
        items?.forEach(item => {
          const label = item.normalized_label || item.metadata?.title || 'unlabeled';
          console.log(`      - ${item.type}: ${label}`);
        });
        
        break;
      }
    }
    
    if (!basketWithBlocks) {
      console.log('❌ No baskets with existing blocks found for evolution testing');
      return;
    }
    
    console.log('\\n📝 Creating dump with content that should trigger evolution operations...');
    
    // Create content that should overlap with existing substrate
    const evolutionTestContent = `
Business Strategy Update - Q1 Performance Review

Executive Summary:
Our analytics platform has exceeded expectations with 98% accuracy in predictions. The machine learning algorithms have been refined to deliver more precise recommendations. User adoption has grown significantly, particularly among mobile users who represent 65% of our active base.

Key Performance Metrics:
- Model accuracy improved from 95% to 98%
- User engagement increased by 35% 
- Mobile usage now represents majority of traffic
- Advanced search capabilities showing strong user preference

Strategic Insights:
- Data shows mobile users have distinct usage patterns
- Peak engagement consistently occurs during midday hours (11am-2pm)
- Power users heavily utilize advanced search and filtering
- Personalization features are driving increased session duration

Implementation Progress:
- Real-time recommendation engine is 80% complete
- Mobile-first design principles applied to 15 new features
- Infrastructure scaling completed to support 2x user load
- User research sessions scheduled for next quarter

Team Highlights:
Sarah contributed significantly to the error handling improvements in our data ingestion pipeline. The team has identified opportunities for better load balancing and system optimization.

Next Quarter Goals:
- Complete personalization rollout
- Expand mobile feature set
- Optimize infrastructure costs
- Conduct comprehensive user experience research
`;

    console.log(`Content length: ${evolutionTestContent.length} characters`);
    console.log(`Content preview: ${evolutionTestContent.substring(0, 200)}...\\n`);
    
    // Create the dump
    const dumps = [{
      dump_request_id: uuidv4(),
      text_dump: evolutionTestContent,
      source_meta: { test: 'comprehensive_evolution_test' }
    }];
    
    const { data: ingestResult, error: dumpError } = await supabase.rpc(
      'fn_ingest_dumps',
      {
        p_workspace_id: basketWithBlocks.workspace_id,
        p_basket_id: basketWithBlocks.id,
        p_dumps: dumps
      }
    );
    
    if (dumpError) {
      console.error('❌ Failed to create dump:', dumpError);
      return;
    }
    
    const newDumpId = ingestResult[0].dump_id;
    console.log(`✅ Created evolution test dump: ${newDumpId}`);
    
    // Wait for processing
    console.log('\\n⏳ Waiting 15 seconds for P1 evolution processing...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check for new proposals with detailed analysis
    console.log('\\n🔍 Analyzing evolution results...');
    const { data: recentProposals } = await supabase
      .from('proposals')
      .select('id, ops, status, validator_report, created_at, provenance')
      .gte('created_at', new Date(Date.now() - 120000).toISOString()) // Last 2 minutes
      .order('created_at', { ascending: false });
    
    if (!recentProposals || recentProposals.length === 0) {
      console.log('❌ No recent proposals found - evolution agent may not be running');
      return;
    }
    
    console.log(`\\n📋 Found ${recentProposals.length} recent proposals:`);
    
    let ourProposal = null;
    recentProposals.forEach((proposal, i) => {
      const isOurs = proposal.provenance?.includes(newDumpId);
      if (isOurs) ourProposal = proposal;
      
      console.log(`\\n  📄 Proposal ${i + 1}: ${proposal.id} ${isOurs ? '(OURS)' : ''}`);
      console.log(`      Status: ${proposal.status}`);
      console.log(`      Created: ${proposal.created_at}`);
      
      if (proposal.ops) {
        const opTypes = proposal.ops.map(op => op.type).filter(Boolean);
        const operationCounts = opTypes.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`      Operations: ${JSON.stringify(operationCounts)}`);
        
        // Check for evolution operations
        const evolutionOps = ['ReviseBlock', 'UpdateContextItem', 'MergeContextItems'];
        const hasEvolution = opTypes.some(type => evolutionOps.includes(type));
        const hasOnlyCreate = opTypes.every(type => ['CreateBlock', 'CreateContextItem'].includes(type));
        
        console.log(`      Has Evolution Ops: ${hasEvolution ? '✅ YES' : '❌ NO'}`);
        console.log(`      Only Creation Ops: ${hasOnlyCreate ? '⚠️ YES' : '✅ NO'}`);
        
        // Show sample operations
        if (isOurs && proposal.ops.length > 0) {
          console.log('\\n      🔍 Sample Operations:');
          proposal.ops.slice(0, 3).forEach((op, idx) => {
            console.log(`         ${idx + 1}. ${op.type}`);
            if (op.data?.content) {
              console.log(`            Content: ${op.data.content.substring(0, 60)}...`);
            }
            if (op.data?.label) {
              console.log(`            Label: ${op.data.label}`);
            }
            if (op.data?.block_id || op.data?.context_item_id) {
              console.log(`            Target: ${op.data.block_id || op.data.context_item_id}`);
            }
          });
        }
      }
      
      if (proposal.validator_report) {
        const confidence = proposal.validator_report.confidence || 0;
        const hasWarnings = proposal.validator_report.warnings && proposal.validator_report.warnings.length > 0;
        const autoApprovalEligible = confidence > 0.7 && !hasWarnings;
        
        console.log(`      Confidence: ${confidence.toFixed(3)}`);
        console.log(`      Warnings: ${hasWarnings ? proposal.validator_report.warnings.length : 0}`);
        console.log(`      Auto-approval eligible: ${autoApprovalEligible ? '✅ YES' : '❌ NO'}`);
        
        if (proposal.status === 'PROPOSED' && autoApprovalEligible) {
          console.log('      ⚠️ HIGH CONFIDENCE BUT NOT AUTO-APPROVED - Bug in auto-approval logic');
        }
      }
    });
    
    // Summary assessment
    console.log('\\n\\n📊 Evolution Agent Assessment:');
    console.log('═══════════════════════════════');
    
    if (ourProposal) {
      console.log('✅ Successfully processed dump');
      console.log(`✅ Generated proposal: ${ourProposal.id}`);
      
      const ops = ourProposal.ops || [];
      const opTypes = ops.map(op => op.type).filter(Boolean);
      const hasEvolution = opTypes.some(type => 
        ['ReviseBlock', 'UpdateContextItem', 'MergeContextItems'].includes(type)
      );
      
      if (hasEvolution) {
        console.log('✅ Evolution operations detected - P1 agent is working correctly');
      } else {
        console.log('❌ No evolution operations - P1 agent not performing substrate evolution');
        console.log('   This suggests existing substrate comparison is not working');
      }
      
      const confidence = ourProposal.validator_report?.confidence || 0;
      if (confidence > 0.7 && ourProposal.status === 'PROPOSED') {
        console.log('❌ Auto-approval not working despite high confidence');
      } else if (ourProposal.status === 'APPROVED') {
        console.log('✅ Auto-approval working correctly');
      }
      
    } else {
      console.log('❌ Failed to generate proposal from test dump');
    }
    
  } catch (err) {
    console.error('❌ Comprehensive test failed:', err.message);
  }
}

testEvolutionComprehensive();