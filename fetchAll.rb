#!ruby
##
## Fetch the current SixFlags Hours for all parks
##

require 'io/console'
require 'json'
require 'fileutils'

def log(msg)
    puts
    puts "==="
    puts "=== #{msg}"
    puts "==="
end

def logRun(msg)
    log(msg)
    system(msg)
end

path = File.expand_path(File.dirname(__FILE__))
Dir.chdir(path)

today = Time.now
today_string = today.strftime('%Y-%m-%d/%H-%M-%S')
suffix = ('a'..'z').to_a.shuffle[0,6].join
branch = "fetch/#{today_string}/#{suffix}"

fetch_arg1 = ARGV[0] || "up"
fetch_arg2 = ARGV[1] || "up"
fetch_id = ARGV[2] || "all"

if fetch_arg1 == 'commit'
    logRun "git checkout -b #{branch}"
    logRun "git push --set-upstream origin #{branch}"
end

summary_file = ENV['GITHUB_STEP_SUMMARY']
open(summary_file, 'a') { |f|
  f.puts "# SixFlags Fetch"
  f.puts
  f.puts "| Park Name | JSON | Archive | Upcoming |"
  f.puts "| --------- | ---- | ------- | -------- |"
}


all_parks = JSON.parse(File.read('data/park/sixflags.json'))
all_parks.each do |park|
    if fetch_id == 'all' || fetch_id.to_s == park['parkId'].to_s
        log(park['name'])
        logRun("./fetch.sh #{fetch_arg1} #{fetch_arg2} #{park['parkId']}")
    end
end

if fetch_arg1 == 'commit'
    logRun("git checkout main")
    logRun("git merge -m 'Merge #{branch}' #{branch}")
    logRun("git push")
    logRun("git branch -d #{branch}")
    logRun("git push origin --delete #{branch}")
end
