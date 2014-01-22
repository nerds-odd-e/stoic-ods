MOCHA_OPTS = --timeout 10000
REPORTER = spec
TEST_FILES = test/*.js
MOCHA = mocha

lint:
	jshint lib/*.js test/*.js --config .jshintrc

test: lint
	$(MOCHA) \
		$(MOCHA_OPTS) \
		--reporter $(REPORTER) \
		$(TEST_FILES)

clean:
	[ -d "coverage" ] && rm -rf coverage || true
	[ -d "lib-cov" ] && rm -rf lib-cov || true
	[ -d "reports" ] && rm -rf reports || true
	[ -d "build" ] && rm -rf build || true

test-reports: clean
	mkdir reports
	$(MAKE) -k test MOCHA="istanbul cover _mocha --" REPORTER=xunit TEST_FILES="$(TEST_FILES) > reports/test.not_xml" || true
	# Remove the console.out and console.err from the top of the text results file and the bottom too
	sed '/^<testsuite/,$$!d' reports/test.not_xml > reports/test.not_xml2
	sed '/^==[=]* Coverage summary =[=]*/,$$d' reports/test.not_xml2 > reports/test.xml
	# Output the other reports formats for jenkins to pick them up
	istanbul report cobertura --verbose
	istanbul report html --verbose

.PHONY: test
