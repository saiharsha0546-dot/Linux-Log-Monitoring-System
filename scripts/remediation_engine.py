#!/usr/bin/env python3
"""
SentinelLog Pro - Remediation & SOAR Engine
Automated threat mitigation and IP blocking orchestration
"""

import sys
import subprocess
import time
import threading
import logging
import json
from datetime import datetime, timedelta

# Configuration
BLOCK_DURATION_MINUTES = 30
LOG_FILE = "remediation.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] SOAR: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

class RemediationEngine:
    def __init__(self):
        self.active_blocks = {} # IP: expiry_time
        self.lock = threading.Lock()

    def block_ip(self, ip, reason):
        """
        Executes firewall block and schedules unblock
        """
        with self.lock:
            if ip in self.active_blocks:
                logging.info(f"IP {ip} is already blocked. Refreshing timer.")
            else:
                try:
                    # In production, this requires root.
                    # We use -C to check if rule exists, or just use -I to insert at top
                    subprocess.run(["iptables", "-I", "INPUT", "-s", ip, "-j", "DROP"], check=True)
                    logging.warning(f"BLOCKED IP: {ip} | Reason: {reason}")
                except Exception as e:
                    logging.error(f"Failed to block {ip}: {e}. Ensure script runs with sudo.")
            
            expiry = datetime.now() + timedelta(minutes=BLOCK_DURATION_MINUTES)
            self.active_blocks[ip] = expiry
            
            # Start unblock timer thread if new
            threading.Thread(target=self.schedule_unblock, args=(ip, expiry)).start()

    def schedule_unblock(self, ip, expiry):
        """
        Waits until expiry and removes the block
        """
        wait_time = (expiry - datetime.now()).total_seconds()
        if wait_time > 0:
            time.sleep(wait_time)
        
        self.unblock_ip(ip)

    def unblock_ip(self, ip):
        """
        Removes the firewall rule
        """
        with self.lock:
            if ip in self.active_blocks:
                try:
                    subprocess.run(["iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"], check=True)
                    logging.info(f"UNBLOCKED IP: {ip} | Duration expired")
                except Exception as e:
                    logging.error(f"Failed to unblock {ip}: {e}")
                
                del self.active_blocks[ip]

    def listen(self):
        """
        Reads JSON events from stdin
        """
        logging.info("SOAR Remediation Engine Listening for events...")
        for line in sys.stdin:
            try:
                event = json.loads(line)
                if event.get("impact") == "HIGH" and "details" in event:
                    # Generic extractor for IP - patterns depend on category
                    # e.g., brute_force pattern: (invalid user, user, IP)
                    details = event["details"]
                    category = event["category"]
                    
                    target_ip = None
                    if category == "BRUTE_FORCE" and len(details) >= 3:
                        target_ip = details[2]
                    elif category == "SUSPICIOUS_IP" and len(details) >= 2:
                        target_ip = details[1]

                    if target_ip:
                        self.block_ip(target_ip, f"Automated response to {category}")
            except Exception as e:
                logging.error(f"Error parsing event: {e}")

if __name__ == "__main__":
    engine = RemediationEngine()
    engine.listen()
