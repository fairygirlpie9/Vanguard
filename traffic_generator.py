import time
import random
from datadog import initialize, statsd

# Vanguard Datadog Credentials
options = {
    'api_key': 'b1d7f14cd1527277e289b3f8fd65dd35',
    'app_key': '265653fdca3c4677cda4403279949304f6c77fd9'
}
initialize(**options)

def run_vanguard_simulation():
    print("Vanguard Traffic Generator Active...")
    print("Simulating hardware telemetry and environmental data...")
    
    while True:
        # Simulate CPU Temperature (Targeting 40C - 75C)
        cpu_temp = random.uniform(45.0, 70.0)
        statsd.gauge('vanguard.pi.cpu_temp', cpu_temp)
        
        # Simulate System Readiness (Calculated environmental safety score)
        readiness = random.uniform(60.0, 98.0)
        statsd.gauge('vanguard.system_readiness', readiness)
        
        # Sends the metric '1' that your "[Vanguard] Pi Connectivity Lost" monitor expects
        statsd.gauge('vanguard.pi.connectivity', 1, tags=["app:vanguard"])
        
        print(f"Update Sent -> CPU: {cpu_temp:.1f}C | Readiness: {readiness:.1f}%")
        time.sleep(15)

if __name__ == "__main__":
    run_vanguard_simulation()