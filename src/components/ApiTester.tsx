import React, { useEffect } from 'react';
import { BananaZoneClient } from '../services/httpService';

export const ApiTester: React.FC = () => {
  useEffect(() => {
    const testAPI = async () => {
      console.log('🚀 ========================================');
      console.log('🚀 STARTING BANANA ZONE API TESTS');
      console.log('🚀 ========================================');
      
      // Initialize client
      console.log('\n🔧 Initializing BananaZone Client...');
      const client = new BananaZoneClient();
      console.log('✅ Client created:', client);
      
      // Test 1: Get all competitions
      console.log('\n🏆 ========================================');
      console.log('🏆 TEST 1: Get All Competitions');
      console.log('🏆 ========================================');
      console.log('📡 Making request to: GET /competition');
      console.log('🔑 Headers: x-banana-key included');
      
      try {
        console.time('⏱️ Get All Competitions');
        const competitions = await client.competitions.getAll();
        console.timeEnd('⏱️ Get All Competitions');
        
        console.log('✅ SUCCESS - Got competitions:');
        console.log('📊 Total count:', competitions.length);
        console.log('📋 Full response:', competitions);
        
        if (competitions.length > 0) {
          console.log('\n🔍 Analyzing first competition:');
          const first = competitions[0];
          console.log('  📝 ID:', first.id);
          console.log('  🎯 Competition Key:', first.competitionKey);
          console.log('  💱 Price Feed ID:', first.priceFeedId);
          console.log('  📊 House Cut Factor:', first.houseCutFactor);
          console.log('  💰 Min Payout Ratio:', first.minPayoutRatio);
          console.log('  ⏱️ Interval (seconds):', first.interval);
          console.log('  👤 Admin:', first.admin);
          console.log('  🕐 Start Time:', new Date(first.startTime * 1000).toISOString());
          console.log('  🕐 End Time:', new Date(first.endTime * 1000).toISOString());
          
          console.log('\n📋 All competition keys:');
          competitions.forEach((comp, index) => {
            console.log(`  ${index + 1}. ${comp.competitionKey} (${comp.priceFeedId})`);
          });
        }
      } catch (error) {
        console.error('❌ FAILED - Get All Competitions:');
        console.error('💥 Error details:', error);
        console.error('🔍 Error message:', error instanceof Error ? error.message : String(error));
      }
      
      // Test 2: Get active competitions
      console.log('\n🏃 ========================================');
      console.log('🏃 TEST 2: Get Active Competitions');
      console.log('🏃 ========================================');
      console.log('⏰ Filtering competitions by current timestamp');
      const now = Math.floor(Date.now() / 1000);
      console.log('⏰ Current timestamp:', now);
      console.log('⏰ Current time:', new Date().toISOString());
      
      try {
        console.time('⏱️ Get Active Competitions');
        const activeCompetitions = await client.competitions.getActive();
        console.timeEnd('⏱️ Get Active Competitions');
        
        console.log('✅ SUCCESS - Got active competitions:');
        console.log('📊 Active count:', activeCompetitions.length);
        console.log('📋 Active competitions:', activeCompetitions);
        
        if (activeCompetitions.length > 0) {
          console.log('\n⏰ Time analysis:');
          activeCompetitions.forEach((comp, index) => {
            const timeLeft = comp.endTime - now;
            console.log(`  ${index + 1}. ${comp.competitionKey}:`);
            console.log(`      End time: ${new Date(comp.endTime * 1000).toISOString()}`);
            console.log(`      Time left: ${timeLeft} seconds (${Math.round(timeLeft / 3600)} hours)`);
          });
        } else {
          console.log('⚠️ No active competitions found');
        }
      } catch (error) {
        console.error('❌ FAILED - Get Active Competitions:');
        console.error('💥 Error details:', error);
        console.error('🔍 Error message:', error instanceof Error ? error.message : String(error));
      }
      
      // Test 3: Get competition by key
      console.log('\n🔍 ========================================');
      console.log('🔍 TEST 3: Get Competition By Key');
      console.log('🔍 ========================================');
      const testKey = '5131FyiapyPHMwoLrzxNtpg13nNDvYprK5GJ2eQreaq2';
      console.log('🎯 Looking for competition key:', testKey);
      
      try {
        console.time('⏱️ Get Competition By Key');
        const solCompetition = await client.competitions.getByKey(testKey);
        console.timeEnd('⏱️ Get Competition By Key');
        
        if (solCompetition) {
          console.log('✅ SUCCESS - Found competition:');
          console.log('📋 Competition details:', solCompetition);
          console.log('\n🔍 Detailed breakdown:');
          console.log('  📝 ID:', solCompetition.id);
          console.log('  🎯 Key:', solCompetition.competitionKey);
          console.log('  💱 Price Feed:', solCompetition.priceFeedId);
          console.log('  📊 House Cut:', solCompetition.houseCutFactor);
          console.log('  💰 Min Payout:', solCompetition.minPayoutRatio);
          console.log('  ⏱️ Interval:', solCompetition.interval, 'seconds');
          console.log('  👥 Admin Keys:', solCompetition.adminKeys);
          console.log('  👤 Admin:', solCompetition.admin);
          console.log('  🕐 Start:', new Date(solCompetition.startTime * 1000).toISOString());
          console.log('  🕐 End:', new Date(solCompetition.endTime * 1000).toISOString());
          
          const timeLeft = solCompetition.endTime - now;
          console.log('  ⏰ Status:', timeLeft > 0 ? 'ACTIVE' : 'EXPIRED');
          console.log('  ⏰ Time left:', timeLeft, 'seconds');
        } else {
          console.log('❌ Competition not found with key:', testKey);
        }
      } catch (error) {
        console.error('❌ FAILED - Get Competition By Key:');
        console.error('💥 Error details:', error);
        console.error('🔍 Error message:', error instanceof Error ? error.message : String(error));
      }
      
      // Test 4: Ping test
      console.log('\n🏓 ========================================');
      console.log('🏓 TEST 4: Ping API');
      console.log('🏓 ========================================');
      console.log('🔗 Testing connectivity to BananaZone API');
      
      try {
        console.time('⏱️ Ping Test');
        const isOnline = await client.ping();
        console.timeEnd('⏱️ Ping Test');
        
        console.log('✅ SUCCESS - Ping completed:');
        console.log('📡 API Status:', isOnline ? 'ONLINE ✅' : 'OFFLINE ❌');
        console.log('🕐 Test timestamp:', new Date().toISOString());
        
        if (isOnline) {
          console.log('🎉 API is fully reachable and responding correctly!');
        } else {
          console.log('⚠️ API appears to be offline or unreachable');
        }
      } catch (error) {
        console.error('❌ FAILED - Ping Test:');
        console.error('💥 Error details:', error);
        console.error('🔍 Error message:', error instanceof Error ? error.message : String(error));
      }
      
      // Test Summary
      console.log('\n🏁 ========================================');
      console.log('🏁 API TESTING COMPLETE');
      console.log('🏁 ========================================');
      console.log('📋 Summary:');
      console.log('  🏆 Get All Competitions: Tested');
      console.log('  🏃 Get Active Competitions: Tested');
      console.log('  🔍 Get Competition By Key: Tested');
      console.log('  🏓 Ping API: Tested');
      console.log('\n✨ Check the console logs above for detailed results!');
      console.log('🚀 ========================================');
    };
    
    // Run tests
    testAPI();
  }, []);

  return null; // No UI needed, just console output
};