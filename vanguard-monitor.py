{
	"id": 96639567,
	"name": "[Vanguard] Pi Connectivity Lost",
	"type": "metric alert",
	"query": "sum(last_5m):sum:vanguard.pi.connectivity{app:vanguard} < 1",
	"message": "Raspberry Pi connectivity lost! @droyer",
	"tags": [
		"app:vanguard",
		"alert:critical"
	],
	"options": {
		"thresholds": {
			"critical": 1
		},
		"notify_no_data": true,
		"no_data_timeframe": 2,
		"notify_audit": false,
		"new_host_delay": 300,
		"include_tags": true
	},
	"priority": null,
	"draft_status": "published"
}