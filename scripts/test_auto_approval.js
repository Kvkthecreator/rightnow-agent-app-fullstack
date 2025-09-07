const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAutoApproval() {
  try {
    console.log('🤖 Testing Auto-Approval Fix...\n');
    
    // Use the same basket from before to avoid confusion
    const basketId = 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
    const { data: basket } = await supabase
      .from('baskets')
      .select('workspace_id')
      .eq('id', basketId)
      .single();
    
    if (!basket) {
      console.error('❌ Test basket not found');
      return;
    }
    
    console.log(`📦 Testing with basket: ${basketId}`);
    console.log(`🌐 Workspace: ${basket.workspace_id}\n`);
    
    // Create a simple test dump that should have high confidence
    const testContent = `
Testing Auto-Approval System

Summary: This is a controlled test of the auto-approval mechanism for high-confidence proposals.

Key Points:
- Auto-approval should trigger for confidence > 0.7
- Operations should execute immediately after approval
- Substrate should be created without manual intervention

Technical Details:
- Testing Supabase client API compatibility fixes
- Verifying proposal status transitions work correctly
- Ensuring execution log is populated properly

Expected Outcome: This proposal should be auto-approved and auto-executed.
`;

    console.log('📝 Creating test dump for auto-approval...');
    console.log(`Content length: ${testContent.length} characters\n`);
    
    const dumps = [{
      dump_request_id: uuidv4(),
      text_dump: testContent,
      source_meta: { test: 'auto_approval_fix_test', timestamp: new Date().toISOString() }
    }];
    
    const { data: ingestResult, error: dumpError } = await supabase.rpc(
      'fn_ingest_dumps',
      {
        p_workspace_id: basket.workspace_id,
        p_basket_id: basketId,
        p_dumps: dumps
      }
    );
    
    if (dumpError) {
      console.error('❌ Failed to create dump:', dumpError);
      return;
    }
    
    const newDumpId = ingestResult[0].dump_id;
    console.log(`✅ Created auto-approval test dump: ${newDumpId}`);
    
    // Wait for processing
    console.log('\n⏳ Waiting 20 seconds for P1 processing and auto-approval...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check the results
    console.log('\n🔍 Checking auto-approval results...');
    const { data: proposals } = await supabase
      .from('proposals')
      .select('*')
      .contains('provenance', [newDumpId])
      .order('created_at', { ascending: false });
    
    if (!proposals || proposals.length === 0) {
      console.log('❌ No proposals found for test dump');
      return;
    }
    
    const proposal = proposals[0];
    console.log(`\n📋 Proposal Analysis: ${proposal.id}`);
    console.log(`   Status: ${proposal.status}`);
    console.log(`   Created: ${proposal.created_at}`);
    console.log(`   Is Executed: ${proposal.is_executed || false}`);
    console.log(`   Executed At: ${proposal.executed_at || 'Not executed'}`);
    
    if (proposal.validator_report) {
      const confidence = proposal.validator_report.confidence || 0;
      const warnings = proposal.validator_report.warnings || [];
      console.log(`   Confidence: ${confidence.toFixed(3)}`);
      console.log(`   Warnings: ${warnings.length}`);
      console.log(`   Auto-approval eligible: ${confidence > 0.7 && warnings.length === 0 ? 'YES' : 'NO'}`);
    }
    
    if (proposal.execution_log) {
      console.log(`\n📊 Execution Log (${proposal.execution_log.length} operations):`);
      proposal.execution_log.forEach((log, i) => {
        console.log(`   ${i + 1}. ${log.operation_type}: ${log.success ? '✅' : '❌'} ${log.success ? '' : log.error_message || ''}`);
        if (log.result_data?.created_id) {
          console.log(`      Created: ${log.result_data.created_id}`);
        }
      });
    } else {
      console.log('\n📊 Execution Log: None');
    }
    
    if (proposal.review_notes) {
      console.log(`\n📝 Review Notes: ${proposal.review_notes}`);
    }
    
    // Check if substrate was actually created
    if (proposal.is_executed) {
      console.log('\n🔍 Verifying created substrate...');
      
      // Count new blocks and context items
      const { data: newBlocks } = await supabase
        .from('blocks')
        .select('id, content, semantic_type')
        .eq('basket_id', basketId)
        .gte('created_at', proposal.created_at);
        
      const { data: newItems } = await supabase
        .from('context_items')
        .select('id, normalized_label, type')
        .eq('basket_id', basketId)
        .gte('created_at', proposal.created_at);
      
      console.log(`   New blocks created: ${newBlocks?.length || 0}`);
      if (newBlocks && newBlocks.length > 0) {
        newBlocks.slice(0, 3).forEach(block => {
          console.log(`      - ${block.semantic_type}: ${block.content?.substring(0, 50)}...`);
        });
      }
      
      console.log(`   New context items created: ${newItems?.length || 0}`);
      if (newItems && newItems.length > 0) {
        newItems.slice(0, 3).forEach(item => {
          console.log(`      - ${item.type}: ${item.normalized_label || 'unlabeled'}`);
        });
      }
    }
    
    // Summary assessment
    console.log('\n\n🎯 Auto-Approval Fix Assessment:');
    console.log('═══════════════════════════════');
    
    if (proposal.status === 'APPROVED' && proposal.is_executed) {
      console.log('✅ AUTO-APPROVAL WORKING: Proposal approved and executed automatically');
    } else if (proposal.status === 'APPROVED' && !proposal.is_executed) {
      console.log('⚠️ PARTIAL SUCCESS: Proposal approved but not executed');
    } else if (proposal.status === 'REJECTED') {
      console.log('❌ AUTO-APPROVAL FAILED: Proposal was rejected');
      if (proposal.review_notes) {
        console.log(`   Rejection reason: ${proposal.review_notes}`);
      }
    } else {
      console.log(`⏳ PENDING: Proposal status is ${proposal.status}`);
    }
    
  } catch (err) {
    console.error('❌ Auto-approval test failed:', err.message);
  }
}

testAutoApproval();