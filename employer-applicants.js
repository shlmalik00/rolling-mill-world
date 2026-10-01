function attachResumeHandlers() {
  const buttons = document.querySelectorAll('.view-resume-button');

  buttons.forEach(button => {
    button.addEventListener('click', async function () {
      const resumePath = this.dataset.resumePath;

      console.log('Resume path:', resumePath);
      console.log('Current user:', currentUser?.id);

      if (!resumePath) {
        alert('Resume path is missing.');
        return;
      }

      const originalText = this.textContent;

      this.disabled = true;
      this.textContent = 'Opening...';

      try {
        const {
          data,
          error
        } = await applicantsSupabase.storage
          .from('resumes')
          .createSignedUrl(resumePath, 300);

        console.log('Signed URL response:', data);
        console.log('Signed URL error:', error);

        if (error) {
          throw error;
        }

        if (!data || !data.signedUrl) {
          throw new Error('Supabase did not return a signed URL.');
        }

        window.open(
          data.signedUrl,
          '_blank',
          'noopener,noreferrer'
        );

      } catch (error) {
        console.error('Resume access error:', error);

        alert(
          'Resume could not be opened.\n\n' +
          (error.message || 'Unknown error')
        );

      } finally {
        this.disabled = false;
        this.textContent = originalText;
      }
    });
  });
}

